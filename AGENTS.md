# Smeduverse Finance - Agent Guidelines

## Stack

- React 19, TanStack Router + Query, Vite 7, Tailwind CSS v4
- HeroUI v3 (beta.6) — `@heroui/react` + `@heroui/styles`
- Zustand for auth state, Lucide for icons
- Backend: Laravel Sanctum token auth at `api/finances/`

## HeroUI v3 References

- Components: https://v3.heroui.com/react/llms-components.txt
- Full docs: https://v3.heroui.com/react/llms-full.txt
- Theming: https://v3.heroui.com/docs/react/getting-started/theming
- Colors: https://v3.heroui.com/docs/react/getting-started/colors

## Component Rules

All interactive UI MUST use HeroUI v3 components. No raw HTML buttons, inputs, or selects.

Compound component API (NOT flat props):
```tsx
<Card>
  <Card.Header>
    <Card.Title>Title</Card.Title>
    <Card.Description>Desc</Card.Description>
  </Card.Header>
  <Card.Content>...</Card.Content>
</Card>

<Dropdown>
  <Button aria-label="Open">Open</Button>
  <Dropdown.Popover>
    <Dropdown.Menu aria-label="...">
      <Dropdown.Item id="x">X</Dropdown.Item>
    </Dropdown.Menu>
  </Dropdown.Popover>
</Dropdown>

<Tabs selectedKey={key} onSelectionChange={setKey}>
  <Tabs.List><Tabs.Tab id="a">A</Tabs.Tab></Tabs.List>
  <Tabs.Panel id="a">Content</Tabs.Panel>
</Tabs>

<TextField fullWidth>
  <Label>Name</Label>
  <Input placeholder="..." />
</TextField>

<Select aria-label="..." value={v} onChange={setV}>
  <ListBox.Item id="x" textValue="X">X</ListBox.Item>
</Select>
```

## Color Tokens

Use semantic tokens only. Never use raw Tailwind colors (gray-*, blue-*, red-*).

| Token | Usage |
|-------|-------|
| `bg-background` | Page background |
| `bg-surface` | Card/panel backgrounds |
| `text-foreground` | Primary text |
| `text-default-500` | Secondary/muted text |
| `bg-accent` / `text-accent` | Brand color (soft red) |
| `text-accent-foreground` | Text on accent bg |
| `bg-accent-soft` | Light accent background |
| `border-border` | Borders |
| `text-danger` / `bg-danger` | Error states |
| `text-success` / `bg-success` | Success states |
| `text-warning` / `bg-warning` | Warning states |

## Theming

Colors defined via CSS variables in `src/styles.css` using oklch(). Both light and dark themes configured. Root element uses `class="dark" data-theme="dark"`.

## File Structure

```
src/
  routes/
    __root.tsx          # Root layout, head, theme class
    auth.tsx            # Login page
    dashboard.tsx       # Dashboard layout (icon sidebar + main content)
    dashboard/
      index.tsx         # Overview with stats
      fee-types.tsx     # Fee types table
      beasiswa.tsx      # Scholarships
      payments.tsx      # Payment history
      spp.tsx           # Bills/SPP
      reports.tsx       # Reports with tabs
  hooks/
    use-fee-types.ts    # TanStack Query hooks for fee types
    use-scholarships.ts # Scholarship hooks
    use-bills.ts        # Bills hooks
    use-payments.ts     # Payment hooks
    use-reports.ts      # Report hooks
    use-finance-meta.ts # Health check hook
  lib/
    api-client.ts       # Fetch wrapper with auth
    auth.tsx            # useAuth() hook
    auth-store.ts       # Zustand auth store
  types/
    finance.ts          # All TypeScript types
  styles.css            # Theme variables + Tailwind imports
```
