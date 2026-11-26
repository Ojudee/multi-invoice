# UNIVISION DESIGN AND CONSTRUCTION LTD.
### Professional Architectural, Structural, BOQ, Site Inspection & Invoicing System

Official production-grade engineering suite for **Univision Design and Construction Ltd.** located at Sukuta-jabang Highway, Sukuta Dalaba, The Gambia.

## Server-backed accounts and organizations

Authentication and organization data use Supabase Auth and PostgreSQL. The first confirmed account after the database migration is applied is assigned the admin role for **Univision Design and Construction Ltd.** by a database trigger (with email confirmation disabled, the first signup is confirmed immediately). Later signups must be added to an organization by one of its admins. Each organization's portal data is stored in PostgreSQL and protected with row-level security; browser storage is only a local cache.

The app can still be hosted as static files (including GitHub Pages) because authentication and persistence run on Supabase. Supabase Free has service quotas and may pause inactive projects; check the current Supabase plan and terms before relying on it for business-critical data. Free hosting is not a guarantee of unlimited or permanent availability.

### Configure Supabase

1. Create a Supabase project on its Free plan.
2. In the project's SQL Editor, run `supabase/migrations/20261103000000_multi_organization_server.sql`.
3. In **Authentication → URL Configuration**, add the deployed app URL and local development URL to the allowed redirect URLs. Configure email confirmation to match your signup policy.
4. Copy the project URL and anon/publishable key into `.env.local` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (see `.env.example`). For GitHub Actions, add the same names as repository Actions secrets and pass them to the build step.
5. Never put a Supabase service-role key in the frontend or expose it in GitHub Pages build settings. The browser only needs the anon/publishable key; PostgreSQL row-level security enforces organization access.
6. Deploy the app and use **Sign up**. The first account is the Univision admin. Other users sign up with their own email, then an organization admin adds the registered email from **Manage organization**. Members can switch organizations only after they have been added to them.

Existing Univision data in this browser is imported into the server-backed Univision organization the first time its admin signs in. Keep a separate backup before migrating important invoice records. This migration imports available browser-cached portal data only; it does not migrate browser-local accounts or passwords.

### Install on desktop, phone, or tablet

The app includes a web app manifest and install icons. On a supported desktop or Android browser, use its **Install app** or **Add to Home Screen** option; on iPhone or iPad, use Safari's **Share → Add to Home Screen** option. The app layout adapts to narrow screens and device safe areas. Sign-in and organization sync still require an internet connection; the app does not provide offline invoice access.

Authenticated sessions automatically sign out after **30 minutes without activity**. Activity in another tab on the same origin keeps the session active there as well.

---

## 🏛️ Integrated Departments & Service Packages

The application integrates 5 operational engineering divisions with real-time fee calculation, one-click invoice sync, and high-fidelity print generation:

1. **Package 01 — Architectural Drawing Division**:
   - Working Drawing Register (Sheets A-001 through A-501)
   - Regular (75 GMD/m²) & Premium (100 GMD/m²) service deliverable customization
   - Doors & Fenestration Measured Specifications Register
   - Official A4 Printable Architectural Drawing Schedule with ISO title blocks

2. **Package 02 — Structural Engineering & Calculations Division**:
   - 3D Structural Analysis & BS 8110 / Eurocode 2 Load Modeling
   - Foundation pad sizing (160 kN/m² soil bearing capacity), columns, beams, and slabs
   - Bar Bending Schedule (BBS) with rebar cutting lengths, diameter unit weights, and shape codes
   - Printable Structural Engineering Design Sheet with registered engineer stamps

3. **Package 03 — Bills of Quantities (BOQ) & Cost Estimation Division**:
   - Trade section work breakdown (Substructure, Frame, Masonry, Roofing, Finishes, MEP)
   - Dynamic takeoff quantity calculations with material pricing & labor rates
   - Contractor margins (10%), contingency reserves (5%), and trade subtotals
   - CSV export and official printable Bill of Quantities

4. **Package 04 — Site Inspection & Quality Compliance Division**:
   - 8-point physical site walkthrough checklist (Pass / Defect toggles)
   - Technical site observations & photographic defect documentation
   - Action item rectification tracking with deadlines and resolution statuses
   - Official Stamped Site Inspection Certificate & Concrete Pour Clearance (GMD 3,500 turnkey fee)

5. **Invoicing Studio & Commercial Management**:
   - Live interactive split-view and centered A4 paper preview
   - Real-time gross floor area pricing, custom floor scopes, and add-on services
   - 50% deposit tracking, Gambian Dalasi (GMD) accounting, and local bank presets (Ecobank, GTBank, Trust Bank, Bloom Bank, Wave, APS)
   - Per-invoice payment receipts in every portal, with recorded payment history and print / save-as-PDF output
   - Genuine vector PDF generation and isolated print engine

---

## 👥 Department Officials: Who Did What

Each department maintains an audit trail attributing specific responsibilities, professional licenses, and actions to assigned officials:

### 1. Architectural Department
- **Lead Project Architect**: *Arch. Alieu M. Sanyang* (Reg: `GIA-ARC-0142`) — Developed spatial layouts, client brief space planning, room dimensions, facade architectural treatments, and municipal building zoning compliance.
- **Senior Architectural Technologist**: *Binta Badjie* (Reg: `GIA-TECH-0089`) — Produced 1:100 architectural layout sheets, exterior front & rear elevations, longitudinal cross-sections X-X & Y-Y, and roof rainwater drainage layouts.
- **Architectural Joinery Specialist**: *Lamin Conteh* (Reg: `GIA-DRF-0210`) — Measured, specified, and scheduled all security doors, glazed sliding aluminum windows, ironmongery profiles, and daylight/ventilation ratios.
- **Senior Compliance Architect**: *Arch. Ousman Touray* (Reg: `GIA-ARC-0098`) — Audited room clearances, staircase headroom, emergency exits, daylight cross-ventilation, and plot boundary municipal setback lines.
- **Managing Director (Univision)**: *Alh. Musa Ceesay* (Reg: `GAM-DIR-001`) — Authorized official design release, corporate seal stamp, client presentation sign-off, and municipal building permit application endorsement.

### 2. Structural Engineering Department
- **Lead Structural & Civil Engineer**: *Engr. Modou Lamin Ceesay* (Reg: `GAM-COREN-STR-0412`) — Computed 3D load combinations (BS 8110:1997), column load take-downs, shear forces, bending moments, and foundation pad dimensions for 160 kN/m² soil.
- **Senior Structural Detailer**: *Mustapha Faye* (Reg: `GAM-ENG-DET-0315`) — Calculated bar cutting lengths, stirrup bends, bending schedules, and total reinforcement weight (16mm, 12mm, 10mm, 8mm high yield B500B steel).
- **Geotechnical Specialist**: *Engr. Ebrima Jobe* (Reg: `GAM-COREN-GEO-0199`) — Evaluated subsoil strata, coastal ground moisture resistance, foundation concrete cover requirements (50mm pad / 30mm beams), and plinth beams.
- **Senior Engineering Consultant**: *Engr. Pa Malick Sowe* (Reg: `GAM-COREN-STR-0077`) — Audited deflection limits, crack width controls (w_max ≤ 0.3mm), lap lengths, and lateral wind load resistance (28 m/s basic coastal velocity).
- **Principal Engineer & Seal**: *Engr. Modou Lamin Ceesay* (Reg: `GAM-COREN-STR-0412`) — Affixed official licensed engineering seal, certified calculations safety factors, and authorized municipal structural permit submission.

### 3. Bills of Quantities (BOQ) Department
- **Chief Quantity Surveyor**: *Q.S. Sulayman Sonko* (Reg: `GIA-QS-2026-009`) — Directed project cost controls, audited preliminary overheads, vetted contingency allowances (5%), and certified measured bill pricing.
- **Quantity Surveyor (Take-off Lead)**: *Fatoumatta Darboe* (Reg: `GIA-QS-0155`) — Extracted exact physical measurements for Substructure excavation, Reinforced Concrete, Sandcrete blockwork, Roofing trusses, and Finishes.
- **Cost Estimator & Procurement Analyst**: *Momodou Bah* (Reg: `GAM-EST-0402`) — Costed cement bags, basalt aggregates, washed river sand, B500B high-yield rebar, timber profiles, and skilled Gambian masonry daily rates.
- **Commercial Contracts Manager**: *Q.S. Mariama Jarju* (Reg: `GIA-QS-0081`) — Audited contractor margin percentages (10%), tender preliminaries, insurance allocations, and client stage payment cash-flow distributions.

### 4. Site Inspection & Quality Compliance Department
- **Senior Structural & Site Inspection Engineer**: *Engr. L. Bojang* (Reg: `GAM-COREN-CIV-0891`) — Conducted rigorous on-site audit of foundation excavations, reinforcement cage alignment, rebar spacing, and formwork verticality.
- **Materials Testing & Quality Inspector**: *Bakary Sanyang* (Reg: `GAM-QC-0234`) — Inspected 50mm spacer cover blocks, checked rebar rust/cleanliness, verified blockwork mortar bed thickness, and monitored concrete batch slump.
- **HSE & Compliance Specialist**: *Sainey Manneh* (Reg: `NEBOSH-GAM-0518`) — Audited mandatory worker PPE, excavation trench safety, perimeter boundary setback dimensions, and environmental waste containment.
- **Director of Engineering & Technical Signatory**: *Engr. Modou Lamin Ceesay* (Reg: `GAM-COREN-STR-0412`) — Reviewed overall inspection score, checked resolution of punch list items, stamped the official certificate, and approved concrete pour clearance.

### 5. Commercial Invoicing & Finance Department
- **Finance & Contracts Officer**: *Isatou Jobe* (Reg: `GAM-ACC-0388`) — Formulated commercial invoices, milestone breakdown schedules, Gambian Dalasi currency accounting, and official banking remittance references.
- **Managing Director (Univision)**: *Alh. Musa Ceesay* (Reg: `GAM-DIR-001`) — Authorized contractual terms, issued contractor warranty commitments, and executed official corporate signature on client agreements.

---

## 🚀 How to Deploy to GitHub

This repository is already initialized with branch `main` and clean commit history. Follow these steps to push to your GitHub account:

### Step 1: Create a Repository on GitHub
1. Go to [https://github.com/new](https://github.com/new).
2. Enter repository name: `univision-construction-portal` (or any preferred name).
3. Leave "Initialize this repository with a README" **unchecked** (we already have a complete codebase and README).
4. Click **Create repository**.

### Step 2: Push Your Code
In your terminal, run:

```bash
# Add your GitHub remote (replace with your GitHub username)
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/univision-construction-portal.git

# Ensure you are on main branch
git branch -M main

# Push all files and tags to GitHub
git push -u origin main
```

*(Alternatively, if you use the GitHub CLI:* `gh repo create univision-construction-portal --public --source=. --remote=origin --push`*)*

### Step 3: Deploy to GitHub Pages (Automated & Tested)

The repository is pre-configured with **relative asset resolution (`base: './'`)**, **`.nojekyll`**, **`404.html` routing fallback**, and a **ready-to-run GitHub Actions workflow (`.github/workflows/deploy.yml`)**.

#### Method A: Automated GitHub Actions (Recommended)
1. On GitHub, navigate to your repository: **`Ojudee/invoice-packages`** (or your repo).
2. Go to **Settings** > **Pages** (under Code and automation).
3. Under **Build and deployment** > **Source**, change from "Deploy from a branch" to:
   👉 **GitHub Actions**
4. Push your code or click "Run workflow" under Actions.
5. GitHub will automatically build Vite and deploy your app to:
   `https://ojudee.github.io/invoice-packages/`
   *(All assets, fonts, styles, and interactive portals load smoothly with zero 404 errors!)*

#### Method B: Deploy using gh-pages CLI
Alternatively, deploy directly from your local terminal:
```bash
# Build and publish dist directly to the gh-pages branch
npm run deploy
```
Then under **Settings** > **Pages** > **Source**, select **Deploy from a branch** -> branch `gh-pages` / `(root)`.

### Step 4: Alternative Hosting Providers
- **Vercel**: Import repository -> Framework: Vite -> Auto-detects and deploys instantly.
- **Netlify**: Add new site -> Import from Git -> Build command `npm run build`, Publish directory `dist`.
- **Cloud Run / Docker**: Deploy as standard Node container on port 3000.

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Start local development server (port 3000)
npm run dev

# Run TypeScript lint verification
npm run lint

# Build production bundle
npm run build
```

---

## 🏢 Univision Design and Construction Ltd.
- **Location**: Sukuta-jabang Highway, Sukuta Dalaba, The Gambia
- **Phone**: +220 872104724 / +220 7821044
- **Email**: univision0111@gmail.com
- **Slogan**: *Quality Designs. Accurate Solutions. Smarter Construction.*
