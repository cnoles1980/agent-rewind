# Devpost technical feedback — saved draft answers

October 17, 2026. These answers were saved in Devpost’s additional-info form. Corey approved the ratings of 7/10, 8/10 and 8/10. The hackathon entry remains a draft; final rules/terms acceptance and submission have not occurred. No credentials are included here.

## Which models, and why this variant?

NVIDIA Nemotron 3.5 Lightning (nvidia/Nemotron-3_5-Lightning), served through Nebius Token Factory. We chose it for an interactive debugging workflow where latency and cost matter: users send a bounded, reviewed evidence excerpt and need a readable explanation and next check. Keeping reasoning enabled with a 4,096-token thinking budget within an 8,192-token completion limit completed six final selected requests in about 16 seconds. This is a small integration sample, not a comparative model benchmark.

## Output quality

7/10. Nemotron produced useful, readable explanations on clear recorded failures, including the difference between strictly above $50 and $50 or more, with evidence references users could inspect. Early evaluation also exposed unsupported causal claims, premature repair advice and incomplete responses. The final bounded-reasoning configuration completed six selected real requests in about 16 seconds, but a report still asked a redundant clarification and predicted test outcomes too confidently. Citations and valid JSON do not establish diagnostic correctness; users must verify suggestions.

## Fine-tuning or prompt engineering

Prompt engineering; no fine-tuning. The system prompt separates captured evidence from interpretation, treats log instructions as untrusted data, and asks for a plain-English explanation and conditional next step. Users state expected behavior and review the excerpt before sending. The model selects numbered evidence excerpts; the server inserts the captured quotations and validates the report schema and source references. We request JSON-object output, validate locally, and bound reasoning to leave room for the visible answer. Invalid or incomplete responses fail visibly, with no automatic retries.

## Comparison with other models

We did not run a controlled comparison against other providers on the same cases, so we cannot claim superior accuracy or cost. Codex was used to help build and test the application, which is a different task. In our Nemotron evaluation, clear boundary cases produced useful explanations, while incomplete or conflicting evidence exposed unsupported advice and completion problems. The final configuration completed all six selected follow-up cases, but interpretation still needs independent verification.

## Most valuable Nebius capabilities

Nebius Token Factory provided managed runtime inference through its chat-completions API, so we could use an NVIDIA model without operating a GPU server. The Cloudflare Worker calls Nebius with a server-side credential and returns a validated report. Reported usage supports inspection and conservative admission accounting. Imported recordings, notes and saved analyses remain browser-local; only the user-reviewed excerpt is sent for inference. We did not provision dedicated GPU instances or verify inference autoscaling. Sandbox beta access was approved, but execution pricing and lifecycle verification remain incomplete, so sandbox execution is deferred and not a demo claim.

## Likelihood of recommending Nemotron on Nebius

8/10. Managed access to an NVIDIA model made it practical to add real inference to a small independently built app without administering GPUs. Server-side credentials and reported usage fit our reviewed-evidence workflow. I would recommend it for prototypes with explicit budgets, validation and evaluation. Model-specific guidance on reasoning budgets, finish diagnostics and structured output would make the experience easier to recommend for reliability-sensitive uses.

## Inference experience

8/10 for this project. The managed API avoided local GPU setup and let us keep our existing web stack. We could inspect reported usage and validate bounded responses. Integration required experimentation around reasoning/output allocation and structured JSON; initial incomplete responses were difficult to diagnose. We did not run a controlled benchmark against previous cloud or local inference environments, so this is an experience rating, not a performance ranking.

## Additional features or improvements

Clearer model-specific examples for reasoning budgets and structured output would have shortened integration. An early request used 8,140 of the 8,192 completion tokens; earlier incomplete failures lacked enough metadata to establish their exact cause. A schema-valid intermediate response also ended mid-sentence. A 4,096-token thinking budget plus JSON-object generation and strict local validation completed six final requests in 15.7–16.8 seconds. Useful additions: safe, explicit finish diagnostics; reliable schema output without cut-off prose; usage/cost reconciliation examples; and account-specific sandbox pricing with cancellation and cleanup examples.

## What we hope to see next

More dependable evidence-grounded explanations for partial and conflicting logs: distinguish observations from hypotheses, honor a clearly stated user target, ask for authority only when it is unresolved, and avoid predicting tests will pass before they are run. I would also value consistent completion under bounded reasoning/output budgets and realistic evaluation examples with hostile recorded instructions and missing context.

## AI tools used

OpenAI Codex assisted implementation, debugging, testing, documentation and submission preparation. ChatGPT helped with the initial product mockup and logo direction. NVIDIA Nemotron through Nebius Token Factory is the runtime AI inside Agent Rewind: it interprets user-reviewed recorded evidence and suggests a next check. The submitted demo does not claim automatic repair, hidden reasoning reconstruction or live sandbox coding execution.

