<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Catalog AI uses a public POST server function with validated object IDs and server-owned catalog context; visitors do not need accounts to ask astronomy questions.
- Keep AI Gateway calls and prompts inside server execution boundaries; conversation state is transient and scoped to the selected object to prevent cross-object answers.
- Preserve both Oracle Linux Node hosting and Lovable hosting; document server-side AI credentials without putting secrets in source.
