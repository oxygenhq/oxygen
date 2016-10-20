@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\oxygen" %*
) ELSE (
  @SETLOCAL
  @SET PATHEXT=%PATHEXT:;.JS;=;%
  node  "%~dp0\oxygen" %*
)