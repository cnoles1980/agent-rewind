import hashlib
import json
import re
import threading
import time
import warnings
from pathlib import Path

from .redaction import Redactor
from .schema import Event, Note, Run, uid


class Recorder:
    def __init__(
        self,
        name,
        output="runs",
        capture="redacted",
        *,
        model=None,
        provider=None,
        source="python",
        secrets=(),
        sensitive_keys=(),
        configuration=None,
        run_id=None,
    ):
        if capture != "redacted":
            raise ValueError("Only redacted capture is supported")
        self.redactor = Redactor(secrets, sensitive_keys)
        if run_id is not None and not re.fullmatch(r"[A-Za-z0-9_-]{1,120}", run_id):
            raise ValueError("Recorder run_id must use only letters, numbers, underscores, or hyphens")
        safe_id = run_id if self.redactor.clean(run_id) == run_id else None
        self.run = Run(
            name=self.redactor.clean(name),
            id=safe_id or uid(),
            model=self.redactor.clean(model),
            provider=self.redactor.clean(provider),
            source=source,
            configuration=self.redactor.clean(configuration or {}),
            capabilities={
                "context": "captured at model boundaries",
                "reasoning": "provider exposed only",
                "memory": "explicit calls only",
                "timing": "monotonic",
            },
        )
        self.path = Path(output) / f"{self.run.id}.jsonl"
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._file = self.path.open("x", encoding="utf-8")
        self._file.write(self.run.model_dump_json() + "\n")
        self._file.flush()
        self._start = time.monotonic()
        self._seq = 0
        self._lock = threading.RLock()
        self._snapshots = set()
        self._tool_parents = {}
        self._model_snapshots = {}
        self._span_parents = {}
        self._notes = []
        self._finished = False
        self.recording_failed = False

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        if not self._finished:
            self.finish("failed" if exc_type is not None else "success")
        try:
            self._file.close()
        except OSError:
            self.recording_failed = True
            warnings.warn("Agent Rewind could not close its recording cleanly.", RuntimeWarning, stacklevel=2)

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        self.__exit__(*args)

    def emit(self, kind, lane, name, **fields):
        with self._lock:
            event = Event(
                run_id=self.run.id,
                seq=self._seq,
                kind=kind,
                lane=lane,
                name=self.redactor.clean(name),
                elapsed_ms=(time.monotonic() - self._start) * 1000,
                **self.redactor.clean(fields),
            )
            self._seq += 1
            try:
                self._file.write(event.model_dump_json() + "\n")
                self._file.flush()
            except OSError:
                self.recording_failed = True
                warnings.warn(
                    "Agent Rewind could not persist an event; recording is incomplete.",
                    RuntimeWarning,
                    stacklevel=2,
                )
            return event

    def context_snapshot(self, messages, tools=None, state=None):
        data = self.redactor.clean(
            {"messages": messages, "tools": tools or [], "state": state, "completeness": "captured request"}
        )
        snapshot_id = hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()
        with self._lock:
            if snapshot_id not in self._snapshots:
                self.emit("context", "context", "Model context", snapshot_id=snapshot_id, data=data)
                self._snapshots.add(snapshot_id)
        return snapshot_id

    def _begin(self, category, name, arguments, call_id=None, parent_id=None, snapshot_id=None):
        span = call_id or uid()
        parent_id = parent_id or self._tool_parents.get(call_id)
        if category == "model":
            self._model_snapshots[span] = snapshot_id
        elif category == "tool":
            snapshot_id = self._model_snapshots.get(parent_id)
        self._span_parents[span] = parent_id
        self.emit(
            category + ".start",
            "model" if category == "model" else "tools",
            name,
            span_id=span,
            parent_id=parent_id,
            snapshot_id=snapshot_id,
            status="running",
            data={"input": arguments},
        )
        return span, time.monotonic()

    def _end(self, category, name, span, started, output=None, error=None, snapshot_id=None):
        parent_id = self._span_parents.get(span)
        event = self.emit(
            category + ".end",
            "model" if category == "model" else "tools",
            name,
            span_id=span,
            parent_id=parent_id,
            duration_ms=(time.monotonic() - started) * 1000,
            snapshot_id=snapshot_id or self._model_snapshots.get(parent_id),
            status="failed" if error is not None else "success",
            data={"output": output, "error": error},
        )
        if category == "model" and isinstance(event.data.get("output"), dict):
            for choice in event.data["output"].get("choices") or []:
                message = choice.get("message") if isinstance(choice, dict) else None
                if isinstance(message, dict):
                    for call in message.get("tool_calls") or []:
                        if isinstance(call, dict) and isinstance(call.get("id"), str):
                            self._tool_parents[call["id"]] = span
        if error is not None:
            self.emit("error", "errors", name, parent_id=span, status="failed", data={"error": error})

    def model_call(self, function, **kwargs):
        snapshot = self.context_snapshot(kwargs.get("messages", []), kwargs.get("tools"))
        span, started = self._begin("model", kwargs.get("model", "Model call"), kwargs, snapshot_id=snapshot)
        try:
            result = function(**kwargs)
        except BaseException as exc:
            self._end(
                "model",
                "Model call",
                span,
                started,
                error=str(exc) or type(exc).__name__,
                snapshot_id=snapshot,
            )
            raise
        self._end("model", "Model response", span, started, output=result, snapshot_id=snapshot)
        return result

    async def amodel_call(self, function, **kwargs):
        snapshot = self.context_snapshot(kwargs.get("messages", []), kwargs.get("tools"))
        span, started = self._begin("model", kwargs.get("model", "Model call"), kwargs, snapshot_id=snapshot)
        try:
            result = await function(**kwargs)
        except BaseException as exc:
            self._end(
                "model",
                "Model call",
                span,
                started,
                error=str(exc) or type(exc).__name__,
                snapshot_id=snapshot,
            )
            raise
        self._end("model", "Model response", span, started, output=result, snapshot_id=snapshot)
        return result

    def tool_call(self, name, function, *, arguments, call_id=None, parent_id=None):
        span, started = self._begin("tool", name, arguments, call_id, parent_id)
        try:
            result = function(**arguments)
        except BaseException as exc:
            self._end("tool", name, span, started, error=str(exc) or type(exc).__name__)
            raise
        self._end("tool", name, span, started, output=result)
        return result

    async def atool_call(self, name, function, *, arguments, call_id=None, parent_id=None):
        span, started = self._begin("tool", name, arguments, call_id, parent_id)
        try:
            result = await function(**arguments)
        except BaseException as exc:
            self._end("tool", name, span, started, error=str(exc) or type(exc).__name__)
            raise
        self._end("tool", name, span, started, output=result)
        return result

    def memory_write(self, key, value):
        clean_value = next(iter(self.redactor.clean({str(key): value}).values()))
        return self.emit("memory", "memory", "Memory write", data={"key": key, "value": clean_value})

    def annotate(self, text, elapsed_ms=None, event_id=None):
        with self._lock:
            note = Note(
                run_id=self.run.id,
                text=self.redactor.clean(text),
                event_id=self.redactor.clean(event_id),
                elapsed_ms=elapsed_ms if elapsed_ms is not None else (time.monotonic() - self._start) * 1000,
            )
            self._notes.append(note)
            path = self.path.with_suffix(".notes.json")
            tmp = path.with_suffix(".tmp")
            tmp.write_text(json.dumps([n.model_dump() for n in self._notes]), encoding="utf-8")
            tmp.replace(path)
            return note

    async def acontext_snapshot(self, *args, **kwargs):
        return self.context_snapshot(*args, **kwargs)

    async def amemory_write(self, *args, **kwargs):
        return self.memory_write(*args, **kwargs)

    async def aannotate(self, *args, **kwargs):
        return self.annotate(*args, **kwargs)

    def finish(self, status="success"):
        if self._finished:
            return
        if status not in ("success", "failed", "cancelled", "incomplete"):
            raise ValueError("Invalid run status")
        self.emit(
            "run.end",
            "model",
            "Run finished",
            data={"status": "incomplete" if self.recording_failed else status},
        )
        self._finished = True
