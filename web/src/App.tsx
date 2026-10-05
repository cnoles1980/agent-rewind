import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowCounterClockwise,
  ArrowSquareOut,
  ArrowsLeftRight,
  CaretRight,
  CheckCircle,
  Circle,
  Code,
  Copy,
  DownloadSimple,
  FastForward,
  FolderOpen,
  GitBranch,
  GearSix,
  Bug,
  ListBullets,
  LockSimple,
  MagnifyingGlass,
  NotePencil,
  Pause,
  Play,
  Plus,
  Rewind,
  Scissors,
  ShieldCheck,
  SkipBack,
  SkipForward,
  Trash,
  UploadSimple,
  Warning,
  X,
  XCircle,
} from "@phosphor-icons/react";
import Timeline from "./Timeline";
import logo from "./assets/ar-logo.png";
import EventLog from "./EventLog";
import Comparison from "./Comparison";
import Settings, { readPreferences, type Preferences } from "./Settings";
import DebugReport from "./DebugReport";
import StudyPanel from "./StudyPanel";
import Tutorial, { TutorialPrompt, tutorialSteps } from "./Tutorial";
import type { ImportSource } from "./imports";
import { importLocalFile, type ImportProgress } from "./importFile";
import {
  atTime,
  clipTape,
  clock,
  compare,
  download,
  duration,
  evidence,
  startOf,
  validateTape,
  visibleEvents,
  type Event,
  type Tape,
} from "./engine";
import {
  listTapes,
  saveTape,
  removeTape,
  listShares,
  saveShare,
  removeShare,
  type Share,
} from "./storage";
import { api } from "./api";

const pretty = (x: unknown) => JSON.stringify(x, null, 2) ?? "Not captured";
function Json({ value }: { value: unknown }) {
  return <pre>{pretty(value)}</pre>;
}
function Badge({ status }: { status: string }) {
  return (
    <span className={"badge " + status}>
      {status === "success" ? (
        <CheckCircle weight="fill" />
      ) : status === "failed" ? (
        <XCircle weight="fill" />
      ) : (
        <Circle />
      )}
      {status}
    </span>
  );
}
function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <header>
        <h2>{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
export default function App() {
  const [preferences, setPreferences] = useState(readPreferences);
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);
  const [tutorialVisit, setTutorialVisit] = useState(0);
  const importSource = useRef<ImportSource>("auto");
  const importAbort = useRef<AbortController | null>(null);
  const importSaving = useRef(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(
    null,
  );
  const [importSize, setImportSize] = useState(0);
  useEffect(() => () => importAbort.current?.abort(), []);
  const [tapes, setTapes] = useState<Tape[]>([]),
    [current, setCurrent] = useState("example-stale"),
    [selected, setSelected] = useState(""),
    [time, setTime] = useState(22000);
  const [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(preferences.speed),
    [zoom, setZoom] = useState(1),
    [tab, setTab] = useState("Event"),
    [query, setQuery] = useState("");
  const [comparing, setComparing] = useState(true),
    [other, setOther] = useState("example-corrected"),
    [matched, setMatched] = useState<number | null>(null);
  const [modal, setModal] = useState<
      | "demo"
      | "clip"
      | "notes"
      | "library"
      | "shares"
      | "settings"
      | "report"
      | "import"
      | "feedback"
      | null
    >(null),
    [notice, setNotice] = useState(""),
    [error, setError] = useState(""),
    [status, setStatus] = useState<any>(null);
  const [code, setCode] = useState(""),
    [note, setNote] = useState(""),
    [variant, setVariant] = useState("stale"),
    [busy, setBusy] = useState(false),
    [job, setJob] = useState<string | null>(null);
  const [from, setFrom] = useState(18000),
    [to, setTo] = useState(44000),
    [includeContext, setIncludeContext] = useState(false),
    [redactions, setRedactions] = useState(""),
    [reviewed, setReviewed] = useState(false),
    [reviewedTape, setReviewedTape] = useState<Tape | null>(null),
    [published, setPublished] = useState(""),
    [shares, setShares] = useState<Share[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const tape = tapes.find((t) => t.run.id === current),
    otherTape = tapes.find((t) => t.run.id === other),
    total = tape ? duration(tape) : 1;
  const events = useMemo(() => (tape ? visibleEvents(tape) : []), [tape]);
  // Approval is tied to the exact recording object. A live poll can replace it
  // while the dialog is open; changed evidence must be reviewed again.
  const clipReviewed = reviewed && reviewedTape === tape;
  const event =
    events.find((e) => e.id === selected) ??
    events.filter((e) => e.elapsed_ms !== null && e.elapsed_ms <= time).at(-1);
  const comparison = useMemo(() => {
    if (!tape || !otherTape) return { differences: [], error: "" };
    try {
      return { differences: compare(tape, otherTape), error: "" };
    } catch (e) {
      return { differences: [], error: (e as Error).message };
    }
  }, [tape, otherTape]);
  const differences = comparison.differences;
  const refresh = () =>
    api("/status")
      .then(setStatus)
      .catch(() =>
        setStatus({ live_available: false, blockers: ["API is unavailable"] }),
      );
  useEffect(() => {
    let disposed = false;
    (async () => {
      try {
        const [exampleResult, localResult] = await Promise.allSettled([
          api<any[]>("/examples"),
          listTapes(),
        ]);
        const examples =
          exampleResult.status === "fulfilled" ? exampleResult.value : [];
        const local =
          localResult.status === "fulfilled" ? localResult.value : [];
        if (!disposed && exampleResult.status === "rejected")
          setError(
            "Example recordings are unavailable. You can still open and inspect local files.",
          );
        if (!disposed && localResult.status === "rejected")
          setError(
            "Browser storage is unavailable. Previously saved local recordings could not be loaded.",
          );
        let all = [...examples.map(validateTape)];
        for (const t of local) {
          try {
            const valid = validateTape(t);
            all = all.filter((x) => x.run.id !== valid.run.id);
            all.push(valid);
          } catch {
            /* skip incompatible local tape */
          }
        }
        const token = new URLSearchParams(location.search).get("clip");
        if (token) {
          const shared = validateTape(
            await api("/clips/" + encodeURIComponent(token)),
          );
          all.push(shared);
          if (!disposed) {
            setCurrent(shared.run.id);
            setTime(0);
          }
        }
        if (!disposed) {
          setTapes(all);
          if (!token) {
            setSelected("example-stale-e9");
            if (!all.some((t) => t.run.id === "example-stale") && all.length) {
              setCurrent(all[0].run.id);
              setSelected("");
              setTime(0);
            }
          }
        }
      } catch (e) {
        if (!disposed) setError((e as Error).message);
      }
    })();
    refresh();
    return () => {
      disposed = true;
    };
  }, []);
  useEffect(() => {
    if (!playing) return;
    let prev = performance.now();
    let id = 0;
    function frame(now: number) {
      const delta = (now - prev) * speed;
      prev = now;
      setTime((t) => {
        if (t + delta >= total) {
          setPlaying(false);
          return total;
        }
        return t + delta;
      });
      setSelected("");
      id = requestAnimationFrame(frame);
    }
    id = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(id);
  }, [playing, speed, total]);
  useEffect(() => {
    if (!status?.authenticated) return;
    let disposed = false;
    api<any[]>("/demo-runs")
      .then((runs) => {
        const active = runs.find((r) =>
          ["queued", "running"].includes(r.status),
        );
        if (active && !disposed) setJob(active.id);
      })
      .catch(() => {});
    return () => {
      disposed = true;
    };
  }, [status?.authenticated]);
  useEffect(() => {
    if (!job) return;
    let ended = false;
    let polling = false;
    const poll = async () => {
      if (polling || ended) return;
      polling = true;
      try {
        const r = await api("/demo-runs/" + job);
        if (r.tape) {
          const t = validateTape(r.tape);
          const saved = (await listTapes()).find((x) => x.run.id === t.run.id);
          if (saved) t.notes = saved.notes;
          setTapes((old) => [t, ...old.filter((x) => x.run.id !== t.run.id)]);
          setCurrent(t.run.id);
          await saveTape(t);
        }
        if (!["queued", "running"].includes(r.status)) {
          ended = true;
          setJob(null);
          refresh();
          if (r.error) setError(r.error);
          else setNotice("Live run finished. Its actual outcome is recorded.");
        }
      } catch (e) {
        ended = true;
        setJob(null);
        setError((e as Error).message);
      } finally {
        polling = false;
      }
    };
    poll();
    const timer = setInterval(poll, 1000);
    return () => {
      ended = true;
      clearInterval(timer);
    };
  }, [job]);
  const seek = useCallback(
    (value: number) => {
      setTime(Math.max(0, Math.min(value, total)));
      setSelected("");
      setMatched(null);
    },
    [total],
  );
  const select = useCallback((e: Event) => {
    setSelected(e.id);
    setTime(e.elapsed_ms ?? 0);
    setPlaying(false);
    setMatched(null);
  }, []);
  const choose = (id: string) => {
    setTutorialStep(null);
    if (id === other) setOther(current);
    setMatched(null);
    setCurrent(id);
    setSelected("");
    setTime(0);
    setPlaying(false);
    setQuery("");
  };
  const step = (direction: number) => {
    const timed = events.filter((e) => e.elapsed_ms !== null);
    const next =
      direction > 0
        ? timed.find((e) => (e.elapsed_ms ?? 0) > time)
        : timed.filter((e) => (e.elapsed_ms ?? 0) < time).at(-1);
    if (next) select(next);
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        modal ||
        /INPUT|TEXTAREA|SELECT|BUTTON/.test((e.target as HTMLElement).tagName)
      )
        return;
      if (e.code === "Space") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal, time, events]);
  const update = async (t: Tape) => {
    await saveTape(t);
    setTapes((old) => old.map((x) => (x.run.id === t.run.id ? t : x)));
  };
  const openClip = () => {
    if (!tape) return;
    setFrom(Math.max(0, time - 5000));
    setTo(Math.min(total, Math.max(time + 15000, 1)));
    setReviewed(false);
    setPublished("");
    setRedactions("");
    setIncludeContext(false);
    setModal("clip");
  };
  const clip = useMemo(() => {
    if (!tape || modal !== "clip") return null;
    try {
      return clipTape(
        tape,
        from,
        to,
        includeContext,
        redactions.split("\n"),
        clipReviewed,
      );
    } catch {
      return null;
    }
  }, [tape, modal, from, to, includeContext, redactions, clipReviewed]);
  const safe = async (fn: () => Promise<void>) => {
    setError("");
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const importFile = async (file: File) => {
    if (importAbort.current) return;
    const controller = new AbortController();
    importAbort.current = controller;
    setPlaying(false);
    setError("");
    setImportSize(file.size);
    setImportProgress({ phase: "Preparing local import…", percent: null });
    setModal("import");
    try {
      const t = await importLocalFile(
        file,
        importSource.current,
        controller.signal,
        setImportProgress,
      );
      if (controller.signal.aborted)
        throw new DOMException("Import cancelled", "AbortError");
      importSaving.current = true;
      setImportProgress({ phase: "Saving in this browser…", percent: null });
      try {
        await saveTape(t);
      } catch {
        throw new Error(
          "The recording was read, but this browser could not save it. Export and remove unused recordings in Settings → Manage local recordings, then retry. Browser storage may be full or unavailable.",
        );
      }
      setTapes((old) => [t, ...old.filter((x) => x.run.id !== t.run.id)]);
      choose(t.run.id);
      setModal(null);
      setNotice(
        `Opened ${t.events.length} events privately. Nothing was uploaded. ${t.run.warnings.join(" ")}`,
      );
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setModal(null);
        setNotice("Import cancelled. No recording was saved.");
      } else setError((e as Error).message);
    } finally {
      importAbort.current = null;
      importSaving.current = false;
      setImportProgress(null);
    }
  };
  const cancelImport = () => {
    if (importSaving.current) return;
    if (importAbort.current) importAbort.current.abort();
    else setModal(null);
  };
  const openFile = (source: ImportSource = "auto") => {
    setTutorialStep(null);
    importSource.current = source;
    input.current?.click();
  };
  const changePreferences = (p: Preferences) => {
    setPreferences(p);
    setSpeed(p.speed);
    try {
      localStorage.setItem("rewind.preferences.v1", JSON.stringify(p));
    } catch {
      setError("Preferences apply now, but browser storage is unavailable.");
    }
  };
  const jump = (d: (typeof differences)[number] | undefined) => {
    if (!d) return;
    if (d.a) select(d.a);
    setMatched(d.b?.elapsed_ms ?? 0);
    setTab("Event");
  };
  const tutorialTape = tapes.find((t) => t.run.id === "example-stale");
  const tutorialReady =
    !!tutorialTape && tapes.some((t) => t.run.id === "example-corrected");
  const guide = (index: number) => {
    const step = tutorialSteps[index];
    const target = tutorialTape?.events.find(
      (e) => e.kind === "tool.end" && e.name === step.tool,
    );
    if (!target) {
      setError(
        "The guided example is unavailable. You can still open your own recording.",
      );
      return;
    }
    setModal(null);
    setCurrent("example-stale");
    setOther("example-corrected");
    setQuery("");
    setZoom(1);
    select(target);
    setTab(step.tab);
    setComparing(index === 3);
    setTutorialStep(index);
    setTutorialVisit((visit) => visit + 1);
  };
  const values = event && tape ? evidence(tape, event, time) : null,
    context = tape ? atTime(tape, time) : undefined;
  const output: any = values?.output;
  const relatedModel = event?.parent_id
    ? (tape?.events.find(
        (e) => e.span_id === event.parent_id && e.kind === "model.end",
      ) ??
      tape?.events.find(
        (e) => e.span_id === event.parent_id && e.kind === "model.start",
      ))
    : undefined;
  const toolsCount =
    tape?.events.filter((e) => e.kind === "tool.end").length ?? 0;

  return (
    <div className="app">
      <header className="topbar">
        <a href="/" className="brand">
          <img
            className="brand-logo"
            src={logo}
            alt=""
            width={55}
            height={55}
          />
          <span>
            Agent Rewind<small>UNDERSTAND YOUR AGENT’S MISTAKES</small>
          </span>
        </a>
        <div className="workspace-tag">
          <span /> Personal workspace
        </div>
        <div className="top-actions">
          <button disabled={!tutorialReady} onClick={() => guide(0)}>
            Quick start
          </button>
          {status?.study_supported && !status?.authenticated && (
            <button
              onClick={() => {
                setPlaying(false);
                setModal("feedback");
              }}
            >
              Enter invitation code
            </button>
          )}
          {status?.study_supported && (
            <button
              onClick={() => {
                setPlaying(false);
                setModal("feedback");
              }}
            >
              Feedback
            </button>
          )}
          <button
            className="icon-button"
            aria-label="Settings & sources"
            title="Settings & sources"
            onClick={() => {
              setPlaying(false);
              refresh();
              setModal("settings");
            }}
          >
            <GearSix />
          </button>
          <button onClick={() => openFile()}>
            <FolderOpen />
            Open tape
          </button>
          <button
            className={status?.live_available ? "primary" : ""}
            onClick={() => {
              refresh();
              setModal("demo");
            }}
          >
            <Plus />
            New demo run
          </button>
        </div>
      </header>
      <input
        ref={input}
        type="file"
        accept=".json,.jsonl"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void importFile(file);
          e.target.value = "";
        }}
      />
      <aside className="sidebar">
        <div className="side-heading">WORKSPACE</div>
        <button
          className={!comparing ? "nav active" : "nav"}
          onClick={() => setComparing(false)}
        >
          <ListBullets />
          Runs<span className="count">{tapes.length}</span>
        </button>
        <button
          className={comparing ? "nav active" : "nav"}
          onClick={() => setComparing(true)}
        >
          <GitBranch />
          Compare
        </button>
        <button
          className="nav"
          onClick={() =>
            safe(async () => {
              setShares(await listShares());
              setModal("shares");
            })
          }
        >
          <ArrowSquareOut />
          Shared clips
        </button>
        <div className="side-divider" />
        <button
          className="nav"
          onClick={() => {
            setPlaying(false);
            refresh();
            setModal("settings");
          }}
        >
          <GearSix />
          Settings & sources
        </button>
        <div className="side-heading">
          RECENT RUNS
          <button
            aria-label="Manage local library"
            onClick={() => setModal("library")}
          >
            <FolderOpen />
          </button>
        </div>
        <div className="recent-runs">
          {tapes.map((t) => (
            <button
              key={t.run.id}
              className={"recent " + (t.run.id === current ? "chosen" : "")}
              onClick={() => choose(t.run.id)}
            >
              <span className={"status-dot " + t.run.status} />
              <span>
                <b>{t.run.name}</b>
                <small>
                  {t.run.source === "example"
                    ? "Example"
                    : t.run.source === "demo"
                      ? "Live recording"
                      : "Browser-local"}{" "}
                  · {String(t.run.configuration.variant ?? t.run.source)}
                </small>
              </span>
              <CaretRight />
            </button>
          ))}
        </div>
        <div className="private-card">
          <ShieldCheck size={24} />
          <b>Your tapes stay yours.</b>
          <p>
            Imported recordings stay in this browser. Only reviewed excerpts
            leave when you request analysis or publish a clip.
          </p>
          <button onClick={() => openFile()}>
            Open a recording <UploadSimple />
          </button>
        </div>
        <div className="sidebar-foot">
          <span className="status-dot success" />
          Local library<span>v0.1.0</span>
        </div>
      </aside>
      <main className="main">
        {status?.budget_alert && (
          <div role="status" className="toast">
            Budget notice: at least {status.budget_alert}% of the $100 ceiling
            is spent or reserved. No spending limit is increased automatically.
          </div>
        )}
        {(error || notice) && (
          <div
            role={error ? "alert" : "status"}
            className={"toast " + (error ? "error" : "")}
          >
            <span>{error || notice}</span>
            <button
              aria-label="Dismiss message"
              onClick={() => {
                setError("");
                setNotice("");
              }}
            >
              <X />
            </button>
          </div>
        )}
        {tutorialStep === null ? (
          <TutorialPrompt
            ready={tutorialReady}
            onOpen={() => guide(0)}
            onImport={() => {
              setPlaying(false);
              setModal("settings");
            }}
            onAccess={
              status?.study_supported && !status?.authenticated
                ? () => {
                    setPlaying(false);
                    setModal("feedback");
                  }
                : undefined
            }
          />
        ) : (
          <Tutorial
            index={tutorialStep}
            onStep={guide}
            onEvidence={() => {
              guide(tutorialStep);
              requestAnimationFrame(() => {
                document
                  .querySelector(
                    tutorialStep === 3 ? ".paired-evidence" : ".inspector",
                  )
                  ?.scrollIntoView({ block: "start" });
              });
            }}
            onClose={() => {
              setTutorialStep(null);
              setComparing(true);
            }}
            onReport={() => {
              guide(tutorialSteps.length - 1);
              setModal("report");
            }}
            onImport={() => {
              setTutorialStep(null);
              setModal("settings");
            }}
            onFeedback={
              status?.study_supported ? () => setModal("feedback") : undefined
            }
          />
        )}
        {!tape ? (
          <div className="empty">
            <Rewind size={44} />
            <h1>Open a run. Find the moment.</h1>
            <p>{error || "Loading example recordings…"}</p>
            <button onClick={() => openFile()}>Open local tape</button>
          </div>
        ) : (
          <>
            <div className="breadcrumb">
              Runs <CaretRight /> {tape.run.name}
              <span className="local-label">
                <LockSimple />
                {tape.run.source === "example"
                  ? "Illustrative example"
                  : tape.run.source === "demo"
                    ? "Hosted demo"
                    : "Browser-local recording"}
              </span>
            </div>
            <section className="run-header">
              <div>
                <h1>
                  {tape.run.name}
                  <span className="model-tag">
                    <Code />
                    {tape.run.model ?? "Model not captured"}
                  </span>
                </h1>
                <div className="run-meta">
                  <span>
                    {isNaN(Date.parse(tape.run.started_at))
                      ? "Time unknown"
                      : new Date(tape.run.started_at).toLocaleString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "UTC",
                            timeZoneName: "short",
                          },
                        )}
                  </span>
                  <span>
                    {tape.run.duration_ms === null
                      ? "Duration unknown"
                      : clock(total) + " duration"}
                  </span>
                  <Badge status={tape.run.status} />
                </div>
              </div>
              <div className="run-actions">
                <button
                  disabled={!event}
                  onClick={() => {
                    setPlaying(false);
                    setModal("report");
                  }}
                >
                  <Bug />
                  Debug report
                </button>
                <button
                  onClick={() => setComparing(!comparing)}
                  className={comparing ? "selected-button" : ""}
                >
                  <GitBranch />
                  Compare
                </button>
                <button onClick={openClip}>
                  <Scissors />
                  Clip & share
                </button>
              </div>
            </section>
            {tape.run.warnings.length > 0 && (
              <div className="capture-note">
                <Circle weight="fill" />
                <span>{tape.run.warnings[0]}</span>
                <button
                  title={tape.run.warnings.join("\n")}
                  onClick={() => setNotice(tape.run.warnings.join(" "))}
                >
                  Capture details
                </button>
              </div>
            )}
            {comparing && (
              <Comparison
                key={
                  current +
                  other +
                  (tutorialStep === 3 ? `guided-${tutorialVisit}` : "")
                }
                initialDifference={
                  tutorialStep === 3
                    ? differences.find(
                        (d) =>
                          d.a?.name === "read_policy" && d.type === "behavior",
                      )
                    : undefined
                }
                a={tape}
                b={otherTape}
                tapes={tapes}
                time={time}
                timeB={
                  matched ?? Math.min(time, otherTape ? duration(otherTape) : 0)
                }
                differences={differences}
                error={comparison.error}
                onChoose={(id) => {
                  setOther(id);
                  setMatched(null);
                }}
                onSeek={seek}
                onSeekB={setMatched}
                onJump={jump}
              />
            )}
            <div className="studio">
              <div className="player">
                <div className="transport">
                  <div className="transport-left">
                    <button
                      className="play"
                      aria-label={playing ? "Pause playback" : "Play recording"}
                      onClick={() => {
                        if (time >= total) setTime(0);
                        setPlaying(!playing);
                      }}
                    >
                      {playing ? (
                        <Pause weight="fill" />
                      ) : (
                        <Play weight="fill" />
                      )}
                    </button>
                    <button
                      className="icon-button"
                      aria-label="Previous event"
                      onClick={() => step(-1)}
                    >
                      <SkipBack />
                    </button>
                    <button
                      className="icon-button"
                      aria-label="Next event"
                      onClick={() => step(1)}
                    >
                      <SkipForward />
                    </button>
                    <select
                      aria-label="Playback speed"
                      value={speed}
                      onChange={(e) => setSpeed(Number(e.target.value))}
                    >
                      {[0.5, 1, 2, 4].map((s) => (
                        <option key={s} value={s}>
                          {s.toFixed(1)}×
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="timecode">
                    {clock(time, true)} <span>/ {clock(total, true)}</span>
                  </div>
                  <select
                    aria-label="Timeline zoom"
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                  >
                    <option value={1}>Fit</option>
                    <option value={1.5}>150%</option>
                    <option value={2}>200%</option>
                    {[4, 8, 16, 32, 64].map((level) => (
                      <option key={level} value={level}>
                        {level * 100}%
                      </option>
                    ))}
                  </select>
                </div>
                <div className="seek">
                  <input
                    aria-label="Timeline playhead"
                    type="range"
                    min={0}
                    max={total}
                    step={100}
                    value={time}
                    onChange={(e) => seek(Number(e.target.value))}
                  />
                </div>
                <Timeline
                  tape={tape}
                  time={time}
                  selected={event?.id ?? ""}
                  onSelect={select}
                  onSeek={seek}
                  zoom={zoom}
                />
                <div className="timeline-footer">
                  <span>
                    <span className="live-dot" /> {tape.events.length} recorded
                    events
                  </span>
                  <button
                    onClick={() => {
                      setEditingNote(null);
                      setNote("");
                      setModal("notes");
                    }}
                  >
                    <NotePencil /> Add note at {clock(time)}
                  </button>
                </div>
                <EventLog
                  key={current}
                  events={events}
                  selected={event?.id ?? ""}
                  query={query}
                  onQuery={setQuery}
                  onSelect={select}
                />
              </div>
              <aside className="inspector">
                <div className="inspector-tabs" role="tablist">
                  {["Event", "State", "Raw", "Diff"].map((t) => (
                    <button
                      role="tab"
                      aria-selected={tab === t}
                      key={t}
                      onClick={() => setTab(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {event ? (
                  <div className="inspector-body">
                    <div className="eyebrow">
                      <span className={"event-kind lane-" + event.lane}>
                        {event.lane === "errors" ? <Warning /> : <Code />}
                      </span>
                      {event.kind.replace(".end", " result")}
                      <span>
                        {event.elapsed_ms === null
                          ? "Unknown"
                          : clock(event.elapsed_ms, true)}
                      </span>
                    </div>
                    <h2>
                      {event.name}
                      {event.lane === "tools" ? "()" : ""}
                    </h2>
                    <div className="inspector-status">
                      <Badge
                        status={
                          typeof output?.passed === "boolean"
                            ? output.passed
                              ? "success"
                              : "failed"
                            : event.status
                        }
                      />
                      <span>{event.provenance}</span>
                    </div>
                    {typeof output?.passed === "boolean" && (
                      <p className="event-summary">
                        Tests {output.passed ? "passed" : "failed"} according to
                        the captured result.
                      </p>
                    )}
                    {tab === "Event" && (
                      <>
                        <p className="event-summary">
                          {event.name === "read_policy"
                            ? "The business rule returned to the agent. Inspect the threshold before following it into the next model call."
                            : event.name === "acceptance_tests"
                              ? "An independent check of the exact $50 boundary, outside the agent loop."
                              : event.name === "apply_patch"
                                ? "The implementation written by the agent, with the previous version preserved."
                                : event.lane === "errors"
                                  ? "A recorded failure. Follow the preceding calls to inspect the evidence."
                                  : "Captured activity at this moment in the run."}
                        </p>
                        {event.lane === "model" &&
                          (output?.choices?.[0]?.message?.reasoning_content ||
                            output?.choices?.[0]?.message?.reasoning) && (
                            <div className="data-card">
                              <header>Provider-exposed reasoning</header>
                              <p className="muted">
                                Returned by the provider; not reconstructed from
                                the transcript.
                              </p>
                              <Json
                                value={
                                  output.choices[0].message.reasoning_content ??
                                  output.choices[0].message.reasoning
                                }
                              />
                            </div>
                          )}
                        {values?.input !== undefined && (
                          <div className="data-card">
                            <header>
                              Input
                              <button
                                aria-label="Copy input"
                                onClick={() =>
                                  safe(async () => {
                                    await navigator.clipboard.writeText(
                                      pretty(values.input),
                                    );
                                    setNotice("Input copied.");
                                  })
                                }
                              >
                                <Copy />
                              </button>
                            </header>
                            <Json value={values.input} />
                          </div>
                        )}
                        <div className="data-card">
                          <header>
                            {event.lane === "context"
                              ? "Captured request"
                              : values?.output !== undefined
                                ? "Output"
                                : "Details"}
                          </header>
                          <Json value={values?.output ?? event.data} />
                        </div>
                        <dl>
                          <dt>Duration</dt>
                          <dd>
                            {event.duration_ms === null
                              ? "Not captured"
                              : (event.duration_ms / 1000).toFixed(2) + " s"}
                          </dd>
                          <dt>Timing</dt>
                          <dd>{tape.run.capabilities.timing}</dd>
                          <dt>Context</dt>
                          <dd>
                            {context ? (
                              <button
                                className="text-button"
                                onClick={() => setTab("State")}
                              >
                                View captured state <ArrowSquareOut />
                              </button>
                            ) : (
                              "Not captured"
                            )}
                          </dd>
                          <dt>Related call</dt>
                          <dd>
                            {relatedModel ? (
                              <button
                                className="text-button"
                                onClick={() => select(relatedModel)}
                              >
                                Inspect requesting model call
                              </button>
                            ) : startOf(tape, event)?.seq !== undefined ? (
                              "Event " + startOf(tape, event)?.seq
                            ) : (
                              "—"
                            )}
                          </dd>
                        </dl>
                        {output?.usage && (
                          <div className="usage">
                            <span>
                              {output.usage.prompt_tokens ?? "—"}
                              <small>INPUT TOKENS</small>
                            </span>
                            <span>
                              {output.usage.completion_tokens ?? "—"}
                              <small>OUTPUT TOKENS</small>
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    {tab === "State" && (
                      <>
                        <p className="event-summary">
                          Latest captured state at or before {clock(time, true)}
                          . Missing data is never reconstructed.
                        </p>
                        <Json
                          value={
                            context?.data ?? {
                              capture: tape.run.capabilities.context,
                            }
                          }
                        />
                      </>
                    )}
                    {tab === "Raw" && (
                      <>
                        <p className="event-summary">
                          Sanitized captured record. Hidden reasoning is not
                          available.
                        </p>
                        <Json value={event} />
                      </>
                    )}
                    {tab === "Diff" && (
                      <>
                        {output?.before !== undefined ? (
                          <>
                            <div className="diff-before">
                              <h3>Before</h3>
                              <pre>{String(output.before)}</pre>
                            </div>
                            <div className="diff-after">
                              <h3>After</h3>
                              <pre>{String(output.after)}</pre>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="event-summary">
                              Context compared with the preceding captured
                              snapshot.
                            </p>
                            {context ? (
                              <>
                                <h3>Previous</h3>
                                <Json
                                  value={
                                    tape.events
                                      .filter(
                                        (e) =>
                                          e.kind === "context" &&
                                          e.seq < context.seq,
                                      )
                                      .at(-1)?.data ?? "No earlier snapshot"
                                  }
                                />
                                <h3>At this moment</h3>
                                <Json value={context.data} />
                              </>
                            ) : (
                              <p>No comparable context was captured.</p>
                            )}
                          </>
                        )}
                      </>
                    )}
                    <div className="notes-at-event">
                      <h3>Notes</h3>
                      {tape.notes
                        .filter(
                          (n) =>
                            n.event_id === event.id ||
                            Math.abs(n.elapsed_ms - time) < 1000,
                        )
                        .map((n) => (
                          <div className="inline-note" key={n.id}>
                            <NotePencil />
                            <p>{n.text}</p>
                            <button
                              aria-label="Edit note"
                              onClick={() => {
                                setEditingNote(n.id);
                                setNote(n.text);
                                setModal("notes");
                              }}
                            >
                              <NotePencil />
                            </button>
                            <button
                              aria-label="Delete note"
                              onClick={() =>
                                safe(() =>
                                  update({
                                    ...tape,
                                    notes: tape.notes.filter(
                                      (x) => x.id !== n.id,
                                    ),
                                  }),
                                )
                              }
                            >
                              <Trash />
                            </button>
                          </div>
                        ))}
                      <button
                        onClick={() => {
                          setEditingNote(null);
                          setNote("");
                          setModal("notes");
                        }}
                      >
                        <Plus />
                        Add a note
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="empty-inspector">
                    <MagnifyingGlass size={32} />
                    <h3>Inspect a moment</h3>
                    <p>Select an event or move the playhead.</p>
                  </div>
                )}
              </aside>
            </div>
            <footer className="workspace-footer">
              <span>
                <Rewind weight="fill" />
                Same agents. Clearer stories.
              </span>
              <span>
                {toolsCount} tool calls · {tape.notes.length} notes · Replay
                never re-executes tools
              </span>
            </footer>
          </>
        )}
      </main>
      {modal === "feedback" && (
        <Modal title="Feedback & tester access" onClose={() => setModal(null)}>
          <StudyPanel
            onAccessChange={refresh}
            onStart={tutorialReady ? () => guide(0) : undefined}
          />
        </Modal>
      )}
      {modal === "import" && (
        <Modal
          title={
            error ? "Could not open recording" : "Opening recording locally"
          }
          onClose={cancelImport}
        >
          <p>
            {(importSize / 1024 / 1024).toFixed(1)} MB · No upload · 100 MB
            local limit
          </p>
          {error ? (
            <>
              <p role="alert">{error}</p>
              <button
                onClick={() => {
                  setError("");
                  setModal("settings");
                }}
              >
                Back to Settings & sources
              </button>
            </>
          ) : (
            <>
              <p role="status">
                {importProgress?.phase ?? "Preparing…"}
                {importProgress?.percent !== null &&
                importProgress?.percent !== undefined
                  ? ` ${importProgress.percent}%`
                  : ""}
              </p>
              <progress
                aria-label="Local import progress"
                max={100}
                value={importProgress?.percent ?? undefined}
              />
              <p className="muted">
                Parsing and redaction run in the background. Your original file
                is unchanged.
              </p>
              <button
                disabled={importProgress?.phase === "Saving in this browser…"}
                onClick={cancelImport}
              >
                Cancel import
              </button>
            </>
          )}
        </Modal>
      )}
      {modal === "settings" && (
        <Modal title="Settings & sources" onClose={() => setModal(null)}>
          {error && (
            <p role="alert" className="toast error">
              {error}
            </p>
          )}
          <Settings
            preferences={preferences}
            onPreferences={changePreferences}
            onOpen={openFile}
            onLibrary={() => setModal("library")}
            onTutorial={() => guide(0)}
            status={status}
            onDemo={() => {
              refresh();
              setModal("demo");
            }}
          />
        </Modal>
      )}
      {modal === "report" && tape && event && (
        <Modal
          title="Debug report & Nemotron analysis"
          onClose={() => setModal(null)}
        >
          <DebugReport
            key={tape.run.id + event.id}
            tape={tape}
            event={event}
            preceding={preferences.reportPreceding}
            onAccessChange={refresh}
            onSelect={(id) => {
              const linked = tape.events.find((e) => e.id === id);
              if (linked) {
                select(linked);
                setModal(null);
              }
            }}
          />
        </Modal>
      )}
      {modal === "demo" && (
        <Modal title="Hosted access & demo runs" onClose={() => setModal(null)}>
          <p>
            Your invitation unlocks reviewed Nemotron analysis and clip sharing.
            Fresh coding runs additionally require an available sandbox. Imports
            and replay work without an invitation.
          </p>
          {!status?.authenticated ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                safe(async () => {
                  await api("/session", {
                    method: "POST",
                    body: JSON.stringify({ code }),
                  });
                  setCode("");
                  await refresh();
                });
              }}
            >
              <label>
                Invitation code
                <input
                  type="password"
                  autoComplete="off"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  minLength={12}
                  required
                />
              </label>
              <button className="primary" disabled={busy}>
                Unlock invited features
              </button>
              <p className="muted">
                Public examples work without a code. Imported tapes remain
                browser-local.
              </p>
            </form>
          ) : (
            <>
              <div className="choice-grid">
                {["stale", "corrected"].map((v) => (
                  <button
                    className={
                      "choice " + (variant === v ? "selected-button" : "")
                    }
                    key={v}
                    onClick={() => setVariant(v)}
                  >
                    {v === "stale" ? <Warning /> : <CheckCircle />}
                    <b>{v === "stale" ? "Stale policy" : "Corrected policy"}</b>
                    <small>
                      {v === "stale"
                        ? "Deliberately injects the archived rule."
                        : "Returns the current, inclusive threshold."}
                    </small>
                  </button>
                ))}
              </div>
              <button
                className="primary"
                disabled={busy || !status.live_available || !!job}
                onClick={() =>
                  safe(async () => {
                    const r = await api("/demo-runs", {
                      method: "POST",
                      body: JSON.stringify({
                        scenario: "shipping-boundary",
                        variant,
                        idempotency_key: crypto.randomUUID(),
                      }),
                    });
                    setJob(r.id);
                    setModal(null);
                    setNotice(
                      "Live run queued. Model calls and tool outcomes will appear here.",
                    );
                  })
                }
              >
                <Play />
                Launch fresh run
              </button>
              {job && (
                <button
                  onClick={() =>
                    safe(async () => {
                      await api("/demo-runs/" + job + "/cancel", {
                        method: "POST",
                      });
                    })
                  }
                >
                  Cancel running demo
                </button>
              )}
              <p className="muted">
                Eight model calls maximum · Five-minute deadline · Actual
                outcomes
              </p>
            </>
          )}
          {status?.blockers?.length > 0 && (
            <div className="callout">
              <b>Live execution is not configured yet</b>
              <ul>
                {status.blockers.map((b: string) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <p>
                You can still explore examples and open your own recordings.
              </p>
            </div>
          )}
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
        </Modal>
      )}
      {modal === "notes" && tape && (
        <Modal
          title={"Note at " + clock(time, true)}
          onClose={() => setModal(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              safe(async () => {
                const now = new Date().toISOString();
                await update({
                  ...tape,
                  notes: [
                    ...tape.notes.filter((n) => n.id !== editingNote),
                    {
                      record: "note",
                      id: editingNote ?? crypto.randomUUID(),
                      run_id: tape.run.id,
                      event_id: editingNote
                        ? tape.notes.find((n) => n.id === editingNote)!.event_id
                        : (event?.id ?? null),
                      elapsed_ms: editingNote
                        ? tape.notes.find((n) => n.id === editingNote)!
                            .elapsed_ms
                        : time,
                      text: note,
                      created_at: editingNote
                        ? tape.notes.find((n) => n.id === editingNote)!
                            .created_at
                        : now,
                      updated_at: now,
                    },
                  ],
                });
                setModal(null);
              });
            }}
          >
            <label>
              What should you remember?
              <textarea
                autoFocus
                maxLength={2000}
                required
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What changed at this moment?"
              />
            </label>
            <p className="muted">
              Saved in this browser, separate from the recorded events.
            </p>
            <button className="primary" disabled={busy}>
              Save note
            </button>
          </form>
        </Modal>
      )}
      {modal === "clip" && tape && (
        <Modal title="Clip the evidence" onClose={() => setModal(null)}>
          <p>
            Only the selected events are included. Review everything below
            before sharing.
          </p>
          <div className="range-fields">
            <label>
              Start (seconds)
              <input
                type="number"
                min={0}
                max={total / 1000}
                step={0.1}
                value={from / 1000}
                onChange={(e) => {
                  setFrom(Number(e.target.value) * 1000);
                  setReviewed(false);
                }}
              />
            </label>
            <label>
              End (seconds)
              <input
                type="number"
                min={0}
                max={total / 1000}
                step={0.1}
                value={to / 1000}
                onChange={(e) => {
                  setTo(Number(e.target.value) * 1000);
                  setReviewed(false);
                }}
              />
            </label>
          </div>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={includeContext}
              onChange={(e) => {
                setIncludeContext(e.target.checked);
                setReviewed(false);
              }}
            />
            Include captured context and model requests
          </label>
          {includeContext && (
            <div className="callout">
              Context may contain messages from before this clip. Review the
              complete export.
            </div>
          )}
          <label>
            Extra text to redact (one phrase per line)
            <textarea
              rows={2}
              value={redactions}
              onChange={(e) => {
                setRedactions(e.target.value);
                setReviewed(false);
              }}
              placeholder="A private name, email, or project detail"
            />
          </label>
          <details open className="clip-preview">
            <summary>
              {clip
                ? `${clip.events.length} events · ${(new Blob([pretty(clip)]).size / 1024).toFixed(1)} KB · Complete export preview`
                : "Invalid range"}
            </summary>
            <Json
              value={clip ?? "Choose a start before the end of the clip."}
            />
          </details>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={clipReviewed}
              onChange={(e) => {
                setReviewedTape(tape);
                setReviewed(e.target.checked);
              }}
            />
            I reviewed this clip for private or sensitive information.
          </label>
          <div className="modal-actions">
            <button
              disabled={!clip || !clipReviewed}
              onClick={() => {
                if (clip) download(clip);
              }}
            >
              <DownloadSimple />
              Export clip
            </button>
            <button
              className="primary"
              disabled={!clip || !clipReviewed || busy}
              onClick={() =>
                safe(async () => {
                  if (!clip) return;
                  const result = await api("/clips", {
                    method: "POST",
                    body: JSON.stringify(clip),
                  });
                  await saveShare({ ...result, name: clip.run.name });
                  setPublished(result.url);
                })
              }
            >
              <ArrowSquareOut />
              Create share link
            </button>
          </div>
          <p className="muted">
            Share links require invited access. Anyone with the link can read
            the clip. You can revoke it from Shared clips.
          </p>
          {published && (
            <div className="share-result">
              <a href={published} target="_blank" rel="noreferrer">
                Open shared clip <ArrowSquareOut />
              </a>
              <button
                onClick={() =>
                  safe(async () => {
                    await navigator.clipboard.writeText(published);
                    setNotice("Share link copied.");
                  })
                }
              >
                <Copy />
                Copy link
              </button>
            </div>
          )}
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
        </Modal>
      )}
      {modal === "library" && (
        <Modal title="Browser-local library" onClose={() => setModal(null)}>
          <p>
            These recordings are stored on this device. Export important tapes
            before clearing browser data.
          </p>
          {tapes.map((t) => (
            <div className="library-row" key={t.run.id}>
              <span>
                <b>{t.run.name}</b>
                <small>
                  {t.run.source} · {String(t.run.configuration.variant ?? "")}
                </small>
              </span>
              <button
                aria-label={"Export " + t.run.name}
                onClick={() => download(t)}
              >
                <DownloadSimple />
              </button>
              {t.run.source !== "example" && (
                <button
                  aria-label={"Remove " + t.run.name}
                  onClick={() =>
                    safe(async () => {
                      await removeTape(t.run.id);
                      setTapes((old) =>
                        old.filter((x) => x.run.id !== t.run.id),
                      );
                      if (current === t.run.id) choose("example-stale");
                    })
                  }
                >
                  <Trash />
                </button>
              )}
            </div>
          ))}
          <div className="callout">
            <b>Import a Codex session</b>
            <p>
              Open the selected session JSONL directly. Settings & sources
              includes file locations and setup instructions for each source.
            </p>
            <button onClick={() => setModal("settings")}>
              Choose a recording source
            </button>
          </div>
          <button onClick={() => openFile()}>
            <FolderOpen />
            Open tape
          </button>
        </Modal>
      )}
      {modal === "shares" && (
        <Modal title="Shared clips" onClose={() => setModal(null)}>
          <p>
            Revoking a link removes the hosted clip. Downloaded copies cannot be
            recalled.
          </p>
          {shares.length === 0 && (
            <div className="callout">
              No clips have been shared from this browser.
            </div>
          )}
          {shares.map((s) => (
            <div className="library-row" key={s.token}>
              <span>
                <b>{s.name}</b>
                <a href={s.url} target="_blank" rel="noreferrer">
                  Open clip
                </a>
              </span>
              <button
                onClick={() =>
                  safe(async () => {
                    await api("/clips/" + s.token, {
                      method: "DELETE",
                      headers: { "x-clip-management": s.manage_token },
                    });
                    await removeShare(s.token);
                    setShares(await listShares());
                  })
                }
              >
                <Trash />
                Revoke
              </button>
            </div>
          ))}
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
        </Modal>
      )}
    </div>
  );
}
