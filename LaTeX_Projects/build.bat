@echo off
setlocal

where pdflatex >nul 2>nul
if errorlevel 1 (
    echo pdflatex was not found. Install MiKTeX or add it to PATH.
    exit /b 1
)

pdflatex -interaction=nonstopmode -halt-on-error main.tex
if errorlevel 1 exit /b %errorlevel%

pdflatex -interaction=nonstopmode -halt-on-error main.tex
if errorlevel 1 exit /b %errorlevel%

echo.
echo Build complete: main.pdf
