# Production readback investigation — 2026-10-15

## Confirmed failure and evidence boundary

Both runs published a Vercel production deployment successfully, then failed at
`Production HTML does not reference the expected snapshot`. The old verifier
requested `GET https://hero-next-jade.vercel.app/` with `Accept: text/html`,
`Cache-Control: no-cache`, a 15-second request timeout and `redirect: error`.
Reaching this assertion establishes a successful 2xx response whose content type
included `text/html`, with the expected snapshot URL absent after slash
unescaping. It does **not** establish the exact HTTP status or which deployment
produced that HTML. The snapshot request and hash/schema checks had not run.

Historical logs did not retain response status, headers, request ID, HTML digest
or observed snapshot references. The earlier runtime-log window exceeded Hobby
retention; the newer narrow runtime query returned no records. No plan upgrade,
credential change, cache purge or repeat production deployment was attempted.
The precise historical response and CDN/alias cause cannot be reconstructed from
the retained evidence. Later success alone is not proof of propagation delay.

## Retained timeline (UTC)

| Event | Earlier data update | Brand release |
| --- | --- | --- |
| Actions run | [38765271086](https://github.com/agenticnoob/hero-next/actions/runs/38765271086) | [38772508151](https://github.com/agenticnoob/hero-next/actions/runs/38772508151) |
| Website commit | `298194b5be5501d4dc5c641c4e96fec1360e9f1e` | `ff1942216f8a65c580e47149cf600c2d293cd2d1` |
| Deployment ID | `dpl_7i12LUwsycJMekz6aPyEVWmGPfPM` | `dpl_ELrYKuxeBABb1zc23f2B57nFhjQM` |
| Vercel READY metadata | 16:02:41.382 | 16:54:06.576 |
| Vercel `aliases-assigned` activity | 16:02:41.667 | 16:54:06.870 |
| Readback step starts in Actions log | 16:02:41.879 | 16:54:07.106 |
| Assertion failure in Actions log | 16:02:42.572 | 16:54:07.648 |
| Alias activity → step start | about 212ms | about 236ms |

These timestamps come from deployment metadata, project-scoped Vercel activity
and timestamped Actions logs. The activity records control-plane assignment;
neither it nor a READY state proves every public request already uses the new
deployment. Step-start timestamps are not individual HTTP request timestamps.

The earlier expected path ended in
`snapshot-d6a0d146b9b776f347c42d44719506c9254e2e8a6d0ade2792d7f70ba432d0f8.json`;
the brand release expected
`snapshot-5bbd04f7243e69da8a9cff668424b16df33be55902241a7eb448da7a8cef5fa5.json`.
Both use exact source `c082eebc1785107509de80bb835a6e6b71468fe1` and 147 entries
through October 15; the public identity normalization accounts for the changed
snapshot bytes. The original verifier later passed each selected manifest. Both
original Actions conclusions remain `failure`.

## Additional live observations, not historical response reconstruction

At 17:16 UTC, the production alias and `zzzxc.com` returned HTTP 200 application
HTML containing the brand snapshot path. The alias response reported
`X-Vercel-Cache: HIT`, `Age: 1139`, and a stable HTML SHA-256
`a0cfe12893bf6dcf6e427cd43922da8682f26ff68de998c71e7b172c6d523a85`.
Those headers describe that later request only. `Cache-Control: no-cache` on a
request is not evidence that it was a cache MISS.

The immutable deployment hostnames returned an initial HTTP 302 to Vercel SSO.
Following the redirect produced a 200 `Login – Vercel` page with no journal
reference. This is a separate, currently reproducible protection response, not
the proven cause of the historical assertion: the old verifier disallowed
redirects. Protection was neither disabled nor bypassed.

## Confirmed design defect and limited optimization

The old workflow equated a completed deploy with one immediately successful read
from a mutable alias. It did not correlate deployment ID, project, website commit,
alias binding or the HTTP response's website revision, and left too little
evidence to distinguish stale HTML from another successful HTML response.

The candidate fix checks READY/project/production/commit and the exact alias
binding through the existing credentialed control plane. A build-time public
`X-Hero-Website-Sha` header then identifies the actual application response.
The credential-free readback retries only identified previous responses and
explicit transient transport/HTTP conditions, under one shared 120-second
deadline with backoff. Exact hash/schema/source/count/date checks remain intact.
Unknown versions, login responses and semantic mismatches do not become retryable
merely because they might disappear later. Failure diagnostics add enough safe
response evidence to investigate a recurrence without recording bodies or secrets.

Controlled tests cover recovery, journal-only updates with an unchanged website
commit, captured login/unknown-version rejection, a previous version that never converges,
permanent errors, wrong deployment/commit/alias, credential isolation and total
timeout. The Next routing artifact is checked locally with a synthetic public
revision. At the initial investigation's completion, the candidate had not
been merged or deployed. Production integration is a separate acceptance step;
[current status](../STATUS.md) and [PR #11](https://github.com/agenticnoob/hero-next/pull/11)
track the resulting release evidence.
