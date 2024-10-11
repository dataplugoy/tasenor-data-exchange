# Testing

## UI Testing

To develop UI tests, you can either need docker system running or launch `pnpm dev` in 3
directories: `database`, `backend` and `ui`.

To launch development
```
pnpm dev-ui
```

Currently database reset is not yet done automatically. So some tests may require between tests
```
pnpm load
```
