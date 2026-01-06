# TEET Changeover Tooling - Project Logbook

## Project Overview
A React + TypeScript application for managing machine changeover procedures at Tenaris TEET. The app tracks changeover workflows, times operations, and maintains documentation for pipe manufacturing machines.

**Repository:** https://github.com/Gamtec1000/teetchangeover-tooling
**Tech Stack:** React, TypeScript, Firebase (Firestore + Auth), Vite, Vercel deployment

---

## Current State (January 2026)

### Completed Features

#### Core Application
- [x] **PIN Lock Screen** - Secure access to the application
- [x] **Admin Authentication** - Firebase Auth for admin users
- [x] **Light/Dark Theme** - Toggleable UI themes
- [x] **Tenaris Branding** - Institutional blue (#0033a1) color scheme with Tenaris logo

#### Machine Management
- [x] **Machine CRUD** - Add, edit, delete machines
- [x] **Machine Ordering** - Custom display order (Swaging, Stress Relief, Threading, Buck On)
- [x] **Machine Images** - Support for machine photos

#### Pipe Sizes Management
- [x] **Pipe Size CRUD** - Manage pipe sizes (4.5in, 5in, 5.5in, 7in, 9 5/8in, 13 3/8in)
- [x] **Fixed PipeSize field** - Uses 'size' field instead of 'name'

#### Changeover System
- [x] **Changeover Templates** - Create and manage changeover procedures per machine
- [x] **Template Steps** - Multi-step procedures with ordering
- [x] **Changeover Flow** - Active changeover execution with timer
- [x] **Step Notes** - Operators can add notes during changeover
- [x] **Final Notes** - Summary notes at changeover completion
- [x] **Read-Only Procedures View** - View procedures without starting changeover

#### Parts, Tools & Consumables
- [x] **Parts Management** - Track required parts for changeovers
- [x] **Tools Management** - Track required tools
- [x] **Consumables Management** - Track consumables

#### Dashboard & Analytics
- [x] **Changeover Logs** - Historical record of all changeovers
- [x] **Statistics Cards** - Total changeovers, average duration
- [x] **Bar Chart** - Average time per machine
- [x] **Line Chart** - Duration over time
- [x] **Machine Filter** - Filter logs by machine
- [x] **Pagination** - 10 items per page
- [x] **Delete Logs** - Admin can delete log entries

#### Settings
- [x] **Settings Page** - Configuration options

---

## Commit History

| Commit | Description |
|--------|-------------|
| `7f0f3b8` | Add sample changeover template script for Firestore |
| `9fd293f` | Fix PipeSize to use 'size' field instead of 'name' |
| `d6ad2d0` | Add pipe sizes script: 4.5in, 5in, 5.5in, 7in, 9 5/8in, 13 3/8in |
| `e6b5b20` | Add machine ordering: Swaging, Stress Relief, Threading, Buck On |
| `9ccacfd` | Use tenaris-logo2.png with transparent background |
| `cc0a8a6` | Fix logo: use SVG with transparent background |
| `5610f39` | Update UI to Tenaris institutional branding |
| `4b34ac2` | Update Firebase config to teetchangeover-tooling project |
| `3738b95` | Revert to Firebase backend (keep Vercel deployment) |
| `7e382bf` | Fix Vercel config: remove invalid runtime specification |
| `5733f6a` | Initial commit: Migrate from Firebase to Supabase with Vercel deployment |

---

## Project Structure

```
ChangeOverV2/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminLogin.tsx
│   │   │   ├── BatchStepView.tsx
│   │   │   ├── ChangeoverFlow.tsx
│   │   │   ├── ChangeoverReadOnlyView.tsx
│   │   │   ├── ChangeoverSteps.tsx
│   │   │   ├── ChangeoverTemplatesManagement.tsx
│   │   │   ├── ConsumablesManagement.tsx
│   │   │   ├── Layout.tsx
│   │   │   ├── MachineManagement.tsx
│   │   │   ├── MachineSelection.tsx
│   │   │   ├── NotesModal.tsx
│   │   │   ├── PartsManagement.tsx
│   │   │   ├── PinLockScreen.tsx
│   │   │   ├── PipeSizesManagement.tsx
│   │   │   ├── PreparationSummary.tsx
│   │   │   ├── Settings.tsx
│   │   │   ├── SizeSelection.tsx
│   │   │   └── ToolsManagement.tsx
│   │   ├── App.tsx            # Main app with Dashboard
│   │   ├── App.css
│   │   ├── firebase.ts        # Firebase configuration
│   │   └── main.tsx
│   ├── dist/                  # Build output
│   └── package.json
├── server.js                  # Express server for uploads
├── uploads/                   # Uploaded images/documents
├── add-sample-template.js     # Script to seed sample templates
├── backup_data.mjs            # Backup utility
├── backup_full.json           # Data backup
└── storage.rules              # Firebase storage rules
```

---

## Firebase Collections

| Collection | Purpose |
|------------|---------|
| `machines` | Machine definitions with name, image, order |
| `pipe_sizes` | Available pipe sizes |
| `parts` | Parts inventory |
| `tools` | Tools inventory |
| `consumables` | Consumables inventory |
| `changeover_templates` | Template definitions per machine |
| `changeover_templates/{id}/steps` | Steps within each template |
| `changeover_logs` | Historical changeover records |

---

## Next Steps / TODO

### High Priority
- [ ] Add actual changeover template content for each machine
- [ ] Upload real machine images
- [ ] Add required parts/tools to template steps
- [ ] Test full changeover workflow end-to-end

### Medium Priority
- [ ] Add image support for template steps
- [ ] PDF document attachments for procedures
- [ ] Operator name selection/input
- [ ] Export changeover logs to CSV/Excel

### Low Priority / Future
- [ ] Multi-language support (Spanish)
- [ ] Mobile-optimized view
- [ ] Offline support with service worker
- [ ] Email notifications for completed changeovers
- [ ] QR code scanning for quick machine selection

---

## Development Commands

```bash
# Install dependencies
cd client && npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run sample template script
node add-sample-template.js
```

---

## Deployment

- **Platform:** Vercel
- **Backend:** Firebase (teetchangeover-tooling project)
- **Storage:** Firebase Storage for images/documents

---

*Last updated: January 6, 2026*
