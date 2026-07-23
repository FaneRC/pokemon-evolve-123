## Should I Evolve This Pokemon?

Production-style monorepo app that answers: "Should I evolve this Pokemon now?"

## Architecture Summary

- Frontend: React + TypeScript + Vite (`apps/web`)
- Backend: Express + TypeScript (`apps/api`)
- Static Pages mode: frontend can run fully in-browser from `pokemon.csv` (no live backend required)
- Data source: CSV loader from `apps/api/src/data/pokemon.csv`
- Recommendation core: reusable module at `apps/api/src/lib/recommendation.ts`
- Testing: Vitest unit tests for core scoring and service behavior

## Features

- Case-insensitive autocomplete search by Pokemon name
- Supports branching evolutions and no-further-evolution cases
- Handles `NA` values safely
- Side-by-side stat comparison for six battle stats
- Recommendation modes:
  - Raw stats mode
  - Role-based mode (physical attacker, special attacker, tank, speed)
  - Type/ability-aware mode
- Weighted scoring + confidence score (0-100)
- Human-readable explanation bullets

## Project Tree

```text
should-i-evolve-this-pokemon/
  apps/
    api/
      src/
        app.ts
        server.ts
        lib/recommendation.ts
        services/csvLoader.ts
        services/recommendationService.ts
        services/serviceSingleton.ts
        controllers/recommendationsController.ts
        routes/recommendations.ts
        types/pokemon.ts
        utils/normalize.ts
        data/pokemon.csv
      tests/
        recommendationService.test.ts
        scoreCalculator.test.ts
    web/
      index.html
      src/
        App.tsx
        pages/Home.tsx
        hooks/useRecommendation.ts
        services/apiClient.ts
        components/
          PokemonSearch.tsx
          RecommendationCard.tsx
          StatRadar.tsx
          LoadingState.tsx
        styles/globals.css
        types/recommendation.ts
```

## Local Setup

1. Install Node.js 20+ (Node 22 recommended).
2. From the repository root, install dependencies:

```bash
corepack pnpm install
```

3. Start the app:

```bash
corepack pnpm dev
```

4. Open:
- Web UI: `http://localhost:5173` (or next free port if 5173 is busy)
- API health: `http://localhost:3001/api/health`

You can also run just the static web app:

```bash
cd apps/web
corepack pnpm dev
```

## Test Instructions

Run core recommendation tests:

```bash
cd apps/api
corepack pnpm test
```

## Example User Flows

1. Search "Eevee", choose Role-Based mode with role "Speed", run recommendation.
2. Inspect branching options (Vaporeon/Jolteon/Flareon) with score and tradeoffs.
3. Search "Unown" to verify no-further-evolution handling.
4. Switch to Type/Ability-Aware mode to see type/ability differences in reasoning.

## GitHub Pages Deployment

This repository now includes a Pages workflow at [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml).

1. Push your changes to the `main` branch on GitHub.
2. In GitHub, open repository settings: `Settings -> Pages`.
3. Under `Build and deployment`, set `Source` to `GitHub Actions`.
4. Wait for workflow `Deploy GitHub Pages` to finish.
5. Open the published URL shown in the workflow summary.

Notes:
- The workflow builds `apps/web` and publishes `apps/web/dist`.
- The dataset is copied from `apps/api/src/data/pokemon.csv` into `apps/web/public/pokemon.csv` during `prebuild`.

## Notes

- The current CSV is a starter dataset for demonstration and testing.
- To use your full dataset, replace `apps/api/src/data/pokemon.csv` with the complete file while keeping the same header columns.

```bash
npm install axios
```

4. **Create `src/App.js`**:

```javascript
import React, { useState } from 'react';
import EvolveForm from './components/EvolveForm';
import Result from './components/Result';
import './styles/App.css';

function App() {
  const [result, setResult] = useState(null);

  const handleEvolve = async (name) => {
    const response = await fetch('/api/evolve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });
    const data = await response.json();
    setResult(data);
  };

  return (
    <div className="App">
      <h1>Should I Evolve This Pokémon?</h1>
      <EvolveForm onEvolve={handleEvolve} />
      {result && <Result result={result} />}
    </div>
  );
}

export default App;
```

5. **Create `src/components/EvolveForm.js`**:

```javascript
import React, { useState } from 'react';

const EvolveForm = ({ onEvolve }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onEvolve(name);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter Pokémon name"
        required
      />
      <button type="submit">Check Evolution</button>
    </form>
  );
};

export default EvolveForm;
```

6. **Create `src/components/Result.js`**:

```javascript
import React from 'react';

const Result = ({ result }) => {
  return (
    <div>
      {result.error ? (
        <p>{result.error}</p>
      ) : (
        <p>{result.should_evolve ? "Yes, evolve!" : "No, don't evolve."}</p>
      )}
    </div>
  );
};

export default Result;
```

7. **Create `src/styles/App.css`**:

```css
.App {
  text-align: center;
  padding: 20px;
}

form {
  margin: 20px 0;
}

input {
  padding: 10px;
  margin-right: 10px;
}

button {
  padding: 10px;
}
```

8. **Update `src/index.js`**:

```javascript
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './styles/App.css';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
```

### Step 4: Running the Application

1. **Run the Backend**:

```bash
cd backend
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
python app.py
```

2. **Run the Frontend**:

```bash
cd ../frontend
npm start
```

### Step 5: Testing

1. **Run the tests for the backend**:

```bash
cd backend
python -m unittest discover tests
```

### Step 6: Deployment

For deployment, you can use platforms like Heroku, Vercel, or Netlify. Ensure to set up environment variables and configure your server to serve the frontend and backend correctly.

### Step 7: README.md

Create a `README.md` file in the root directory with the following content:

```markdown
# Should I Evolve This Pokémon?

A web application that helps you decide whether to evolve a Pokémon based on its current level and evolution criteria.

## Setup Instructions

### Backend

1. Navigate to the `backend` directory.
2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```
3. Install the required packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the backend:
   ```bash
   python app.py
   ```

### Frontend

1. Navigate to the `frontend` directory.
2. Install the required packages:
   ```bash
   npm install
   ```
3. Run the frontend:
   ```bash
   npm start
   ```

## Testing

To run the backend tests, navigate to the `backend` directory and run:
```bash
python -m unittest discover tests
```

## Deployment

Instructions for deployment will depend on the platform you choose.
```

### Conclusion

This guide provides a complete setup for a web application called "Should I Evolve This Pokémon?" with a mobile-responsive UI and backend logic. You can expand upon this by adding more features, improving the UI, or integrating with a database for persistent storage.