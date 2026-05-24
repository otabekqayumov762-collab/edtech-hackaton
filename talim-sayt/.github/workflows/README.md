# Workflows

- `backend.yml` / `frontend.yml` — CI bo'yicha mavjud workflowlar.
- `auto-merge-ozodbek.yml` — `ozodbek` branchga push bo'lganda avtomatik
  ravishda `main`ga merge qiladi (`-X theirs` strategiyasi bilan), so'ng
  Vercel `main`dan deploy qiladi. Conflict bo'lsa workflow fail qiladi va
  GitHub email orqali xabar yuboradi.
