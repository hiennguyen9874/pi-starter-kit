# Minimal model-view composition

`model.d2` owns facts:

```d2
web; api; worker; db; queue
web -> api
api -> db
api -> queue
queue -> worker
worker -> db

**: suspend
(** -> **)[*]: suspend
```

`request-view.d2` imports and reveals one view:

```d2
...@model
web: unsuspend
api: unsuspend
db: unsuspend
(web -> api)[0]: unsuspend
(api -> db)[0]: unsuspend
```

`async-view.d2` reveals another:

```d2
...@model
api: unsuspend
queue: unsuspend
worker: unsuspend
db: unsuspend
(api -> queue)[0]: unsuspend
(queue -> worker)[0]: unsuspend
(worker -> db)[0]: unsuspend
```

Validate and render each view as an entry point. If the local D2 version rejects a glob/index form, consult `d2 validate` and the repository's canonical model-view files before adapting it.
