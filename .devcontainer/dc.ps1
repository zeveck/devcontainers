# Thin shim. All logic is in dc.mjs -- see `dc help`.
node "$PSScriptRoot/dc.mjs" @args
exit $LASTEXITCODE
