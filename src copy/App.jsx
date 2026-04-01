import { useEffect, useState } from "react";

const DEFAULT_TEAM_SIZE = 10;
const createId = () =>
  globalThis.crypto?.randomUUID?.() || `member-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const emptyMember = (index) => ({
  id: createId(),
  name: `Member ${index + 1}`,
  dietaryPreference: "either",
  cuisinePreferences: ["south-indian"],
  vibePreferences: ["relaxed"],
  travelToleranceKm: 30
});

function TagPicker({ label, options, values, onChange }) {
  const toggle = (option) => {
    if (values.includes(option)) {
      onChange(values.filter((value) => value !== option));
      return;
    }

    onChange([...values, option]);
  };

  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="chip-grid">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={`chip ${values.includes(option) ? "chip-active" : ""}`}
            onClick={() => toggle(option)}
          >
            {option.replaceAll("-", " ")}
          </button>
        ))}
      </div>
    </div>
  );
}

function PlannerForm({ meta, onSubmit, loading }) {
  const [teamName, setTeamName] = useState("Friday Escape Squad");
  const [budgetPerPerson, setBudgetPerPerson] = useState(800);
  const [distanceLimitKm, setDistanceLimitKm] = useState(40);
  const [members, setMembers] = useState(Array.from({ length: DEFAULT_TEAM_SIZE }, (_, index) => emptyMember(index)));

  const updateMember = (memberId, updates) => {
    setMembers((current) =>
      current.map((member) => (member.id === memberId ? { ...member, ...updates } : member))
    );
  };

  const changeTeamSize = (nextSize) => {
    const safeSize = Math.max(1, Math.min(20, Number(nextSize) || 1));
    setMembers((current) => {
      if (safeSize > current.length) {
        const additions = Array.from({ length: safeSize - current.length }, (_, index) =>
          emptyMember(current.length + index)
        );
        return [...current, ...additions];
      }

      return current.slice(0, safeSize);
    });
  };

  const submit = (event) => {
    event.preventDefault();
    onSubmit({
      teamName,
      teamSize: members.length,
      budgetPerPerson: Number(budgetPerPerson),
      distanceLimitKm: Number(distanceLimitKm),
      members: members.map((member) => ({
        ...member,
        cuisinePreferences:
          member.cuisinePreferences.length > 0 ? member.cuisinePreferences : ["south-indian"],
        vibePreferences: member.vibePreferences.length > 0 ? member.vibePreferences : ["relaxed"]
      }))
    });
  };

  return (
    <form className="planner-card" onSubmit={submit}>
      <div className="planner-header">
        <div>
          <p className="eyebrow">Input preferences</p>
          <h2>Collect the whole team’s choices in one place</h2>
        </div>
        <button type="submit" className="primary-button" disabled={loading || !meta}>
          {loading ? "Generating..." : !meta ? "Loading planner..." : "Generate outing plans"}
        </button>
      </div>

      <div className="overview-grid">
        <label className="field">
          <span className="field-label">Team name</span>
          <input value={teamName} onChange={(event) => setTeamName(event.target.value)} />
        </label>
        <label className="field">
          <span className="field-label">Team size</span>
          <input
            type="number"
            min="1"
            max="20"
            value={members.length}
            onChange={(event) => changeTeamSize(event.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">Budget per person (Rs.)</span>
          <input
            type="number"
            min="300"
            step="50"
            value={budgetPerPerson}
            onChange={(event) => setBudgetPerPerson(event.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">Max distance from office (km)</span>
          <input
            type="number"
            min="5"
            max={meta?.officeDefaults?.maxDistanceKm || 40}
            value={distanceLimitKm}
            onChange={(event) => setDistanceLimitKm(event.target.value)}
          />
        </label>
      </div>

      <div className="members-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Member preferences</p>
            <h3>Mix dietary, cuisine, and vibe preferences</h3>
          </div>
          <p className="muted-text">The planner scores venues that satisfy the widest portion of the group.</p>
        </div>

        <div className="member-list">
          {members.map((member, index) => (
            <article className="member-card" key={member.id}>
              <div className="member-header">
                <span className="member-index">{String(index + 1).padStart(2, "0")}</span>
                <input
                  className="member-name"
                  value={member.name}
                  onChange={(event) => updateMember(member.id, { name: event.target.value })}
                />
              </div>

              <div className="member-grid">
                <label className="field">
                  <span className="field-label">Food preference</span>
                  <select
                    value={member.dietaryPreference}
                    onChange={(event) =>
                      updateMember(member.id, { dietaryPreference: event.target.value })
                    }
                  >
                    {meta?.dietaryOptions?.map((option) => (
                      <option value={option} key={option}>
                        {option.replaceAll("-", " ")}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span className="field-label">Travel tolerance (km)</span>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={member.travelToleranceKm}
                    onChange={(event) =>
                      updateMember(member.id, { travelToleranceKm: Number(event.target.value) })
                    }
                  />
                </label>
              </div>

              <TagPicker
                label="Cuisine choices"
                options={meta?.cuisineOptions || []}
                values={member.cuisinePreferences}
                onChange={(value) => updateMember(member.id, { cuisinePreferences: value })}
              />

              <TagPicker
                label="Outing vibe"
                options={meta?.vibeOptions || []}
                values={member.vibePreferences}
                onChange={(value) => updateMember(member.id, { vibePreferences: value })}
              />
            </article>
          ))}
        </div>
      </div>
    </form>
  );
}

function SummaryBar({ summary }) {
  if (!summary) return null;

  const dietaryParts = Object.entries(summary.dietarySplit || {})
    .map(([key, value]) => `${value} ${key.replaceAll("-", " ")}`)
    .join(" • ");

  return (
    <section className="summary-bar">
      <div>
        <p className="eyebrow">Planner summary</p>
        <strong>{summary.teamSize} members analyzed</strong>
      </div>
      <div>{dietaryParts}</div>
      <div>Top cuisines: {(summary.topCuisines || []).join(", ") || "Flexible"}</div>
      <div>Top vibes: {(summary.topVibes || []).join(", ") || "Flexible"}</div>
    </section>
  );
}

function PlanCard({ plan }) {
  return (
    <article className={`plan-card ${plan.rank === 1 ? "plan-card-featured" : ""}`}>
      <div className="plan-topline">
        <span className="plan-badge">Option {plan.rank}</span>
        <span className="plan-score">Match score {plan.score}</span>
      </div>
      <h3>{plan.title}</h3>
      <p className="plan-venue">
        {plan.venue.name}, {plan.venue.area} • {plan.venue.distanceKm} km from office
      </p>

      <div className="detail-grid">
        <div className="detail-card">
          <span className="detail-label">Venue</span>
          <p>{plan.venue.highlights.join(" · ")}</p>
        </div>
        <div className="detail-card">
          <span className="detail-label">Food option</span>
          <p>{plan.food.recommendation}</p>
          <small>{plan.food.cuisinesSupported.join(", ")}</small>
        </div>
        <div className="detail-card">
          <span className="detail-label">Estimated cost</span>
          <p>Rs. {plan.costBreakdown.perPerson} / person</p>
          <small>Total Rs. {plan.costBreakdown.totalEstimated}</small>
        </div>
      </div>

      <div className="cost-row">
        <span>Entry: Rs. {plan.costBreakdown.entryTotal}</span>
        <span>Food: Rs. {plan.costBreakdown.foodTotal}</span>
        <span>Travel: Rs. {plan.costBreakdown.transportTotal}</span>
      </div>

      <div className="reason-list">
        {plan.reasons.map((reason) => (
          <p key={reason}>{reason}</p>
        ))}
      </div>

      <div className="agenda-list">
        {plan.agenda.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </article>
  );
}

export default function App() {
  const [meta, setMeta] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const response = await fetch("/api/meta");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load planner metadata.");
        }

        setMeta(data);
      } catch (_error) {
        setError("Unable to load planner metadata. Start the backend server and refresh.");
      }
    };

    loadMeta();
  }, []);

  const generatePlans = async (payload) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Planner request failed.");
      }

      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err.message || "Something went wrong while generating plans.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">AI-powered outing planner</p>
          <h1>Turn a messy team chat into 3 clear Hyderabad outing options.</h1>
          <p className="hero-text">
            Capture every teammate’s budget, food, and vibe preferences, then generate outing plans
            that stay within 40 km, support vegetarian and non-vegetarian needs, and show the cost
            breakdown up front.
          </p>
        </div>
        <div className="hero-panel">
          <span className="hero-stat">Budget aware</span>
          <strong>Rs. 800/person ready</strong>
          <span className="hero-stat">Distance capped</span>
          <strong>Only nearby Hyderabad venues</strong>
          <span className="hero-stat">Food balanced</span>
          <strong>Vegetarian + non-vegetarian friendly</strong>
        </div>
      </section>

      {error ? <div className="error-banner">{error}</div> : null}

      <PlannerForm meta={meta} onSubmit={generatePlans} loading={loading} />

      <SummaryBar summary={result?.summary} />

      <section className="results-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Recommended plans</p>
            <h2>2-3 outing ideas that the team can actually say yes to</h2>
          </div>
          <p className="muted-text">Each recommendation balances distance, budget, and food fit.</p>
        </div>

        <div className="plans-grid">
          {result?.plans?.length ? (
            result.plans.map((plan) => <PlanCard plan={plan} key={plan.id} />)
          ) : (
            <div className="empty-state">
              Submit the team preferences to see AI-ranked outing options with venue, meal, and
              pricing recommendations.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
