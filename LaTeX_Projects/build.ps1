Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$texFile = "main.tex"

if (-not (Get-Command pdflatex -ErrorAction SilentlyContinue)) {
    throw "pdflatex was not found. Install MiKTeX or add it to PATH."
}

pdflatex -interaction=nonstopmode -halt-on-error $texFile
pdflatex -interaction=nonstopmode -halt-on-error $texFile
