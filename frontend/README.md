# Frontend

O frontend Next.js é executado pela orquestração Docker na raiz do repositório. Consulte o [README principal](../README.md) para comandos de desenvolvimento e produção.

## Hidratação

O atributo `cz-shortcut-listen` não é renderizado pela aplicação. Se ele aparecer no aviso de hydration do React, foi inserido no elemento `body` por uma extensão do navegador antes da hidratação. Valide a aplicação em uma janela anônima ou em um perfil sem extensões; não use `suppressHydrationWarning` para ocultar esse aviso.
