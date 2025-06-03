import React, { useState, useRef } from "react";
import "./App.css";

// PUBLIC_INTERFACE
function App() {
  /**
   * Smart To-Do List with AI Enhancement
   * Users can add a task. Upon addition, the task text is sent to the Sambanova AI API
   * (https://api.sambanova.ai/v1/generate) for enhancement.
   * Each list item displays both the original and enhanced texts.
   * Each task has edit, delete, and mark complete controls.
   *
   * API integration:
   *  - The real API key and settings should be configured in the enhanceTaskText function below.
   */

  // ---- State ----
  const [tasks, setTasks] = useState([]); // {id, original, enhanced, completed}
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);
  const [editId, setEditId] = useState(null); // id of task being edited
  const [editValue, setEditValue] = useState("");
  const [loadingId, setLoadingId] = useState(null); // id of task being enhanced

  // ---- Handlers ----
  // PUBLIC_INTERFACE
  async function handleAddTask(e) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    setAdding(true);
    setError(null);
    // Create a placeholder task immediately (show spinner for enhancement)
    const tempId = Date.now();
    setTasks(tasks => [
      ...tasks,
      {
        id: tempId,
        original: trimmed,
        enhanced: null,
        completed: false,
      },
    ]);
    setInput("");
    setLoadingId(tempId);
    try {
      const enhanced = await enhanceTaskText(trimmed);
      // If enhancement "looks like" an API fallback (starts with (AI unavailable)), don't set global error.
      setTasks(tasks =>
        tasks.map(t =>
          t.id === tempId
            ? { ...t, enhanced }
            : t
        )
      );
      if (
        typeof enhanced === "string" &&
        enhanced.startsWith("(AI unavailable")
      ) {
        // Enhancement fallback, do NOT show top error,
        // just let the enhanced text itself inform the user in the list.
      }
    } catch (err) {
      setTasks(tasks =>
        tasks.map(t =>
          t.id === tempId
            ? { ...t, enhanced: "(AI unavailable: " + (err && err.message ? err.message : "AI error") + ")" }
            : t
        )
      );
      setError("Failed to enhance task (AI error).");
    }
    setLoadingId(null);
    setAdding(false);
  }

  // PUBLIC_INTERFACE
  function handleToggleComplete(id) {
    setTasks(tasks =>
      tasks.map(t =>
        t.id === id ? { ...t, completed: !t.completed } : t
      )
    );
  }

  // PUBLIC_INTERFACE
  function handleDelete(id) {
    setTasks(tasks => tasks.filter(t => t.id !== id));
  }

  // PUBLIC_INTERFACE
  function handleEdit(id, value) {
    setEditId(id);
    setEditValue(value);
  }

  // PUBLIC_INTERFACE
  async function handleEditSave(id) {
    if (!editValue.trim()) return;
    setLoadingId(id);
    setError(null);
    setTasks(tasks =>
      tasks.map(t =>
        t.id === id
          ? { ...t, original: editValue, enhanced: null }
          : t
      )
    );
    try {
      const enhanced = await enhanceTaskText(editValue);
      setTasks(tasks =>
        tasks.map(t =>
          t.id === id
            ? { ...t, enhanced }
            : t
        )
      );
      if (
        typeof enhanced === "string" &&
        enhanced.startsWith("(AI unavailable")
      ) {
        // Only "show" the fallback in the enhanced text, not the global error.
      }
    } catch (err) {
      setTasks(tasks =>
        tasks.map(t =>
          t.id === id
            ? { ...t, enhanced: "(AI unavailable: " + (err && err.message ? err.message : "AI error") + ")" }
            : t
        )
      );
      setError("Failed to enhance task (AI error).");
    }
    setLoadingId(null);
    setEditId(null);
    setEditValue("");
  }

  function handleEditCancel() {
    setEditId(null);
    setEditValue("");
  }

  // ---- AI Enhancement ----
  // PUBLIC_INTERFACE
  async function enhanceTaskText(text) {
    /**
     * This function sends the task text to the Sambanova AI API to get an enhanced/clarified version.
     * Replace the placeholder fetch call below with your actual API key and prompt/parameters.
     * @param {string} text - Original task input
     * @returns {string} Enhanced/clarified task string
     */
    // ----------- API INTEGRATION (CONFIG) ---------------
    const API_URL = "https://api.sambanova.ai/v1/generate";
    const API_KEY = "<8f824c90-f520-4c3f-b7fc-230a0900156d>"; // <-- Place your API key here!
    // Modify body as per SambaNova API requirements.
    const body = JSON.stringify({
      prompt: `Rewrite the following to-do item in a clearer, more actionable form: "${text}"`,
      // other model settings as needed
      // model: "...",
      // temperature: 0.4,
      // max_tokens: 50,
    });

    // ------
    // In a real app, replace credentials and CORS as needed. Output is faked if API_KEY is unset.
    if (API_KEY === "<YOUR_SAMBANOVA_API_KEY>") {
      // Placeholder mode (no key)
      await new Promise(res => setTimeout(res, 1000));
      return `(AI-enhanced) ${text}`;
    }

    // Actual fetch logic
    let resp, data;
    try {
      resp = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // API keys; use env variables or configs in production:
          "Authorization": `Bearer ${API_KEY}`,
        },
        body,
      });
    } catch (fetchErr) {
      // Network error etc.
      throw new Error("Could not reach Sambanova API.");
    }
    if (!resp.ok) {
      let msg = "API error";
      try {
        const errData = await resp.json();
        msg += (errData && errData.error) ? `: ${errData.error}` : "";
      } catch (_e) {}
      throw new Error(msg);
    }
    try {
      data = await resp.json();
    } catch (parseErr) {
      // Return fallback text, but DO NOT throw.
      return "(AI unavailable: could not parse API JSON)";
    }
    // Robust retrieval: prefer enhanced_text, then choices[0].text, then generic text, fallback to debug
    let result = null;
    if (typeof data === "object" && data !== null) {
      if (typeof data.enhanced_text === "string" && data.enhanced_text.trim()) {
        result = data.enhanced_text.trim();
      } else if (
        Array.isArray(data.choices) &&
        typeof data.choices[0]?.text === "string" &&
        data.choices[0].text.trim()
      ) {
        result = data.choices[0].text.trim();
      } else if (typeof data.text === "string" && data.text.trim()) {
        result = data.text.trim();
      }
    }
    if (!result) {
      // fallback: show API JSON if possible for debug, or simple fallback message
      result =
        "(AI unavailable: invalid API response) " +
        (typeof data === "object" ? JSON.stringify(data) : String(data));
    }
    return result;
  }

  // ---- UI Render ----

  return (
    <div className="app" style={{
      minHeight: "100vh",
      background: "var(--base-dark)",
      color: "var(--text-color)",
      paddingBottom: "40px",
    }}>
      <header className="navbar">
        <div className="logo">
          <span className="logo-symbol">★</span> Smart To-Do List
        </div>
      </header>
      <main className="container" style={{ maxWidth: 540, margin: "120px auto 0", }}>
        <h1 className="title" style={{ fontSize: 40, marginBottom: 4 }}>Smart To-Do List <span role="img" aria-label="AI">🤖</span></h1>
        <div className="description" style={{ marginBottom: 22 }}>
          Add a task. An AI will clarify or polish it for you. Each entry shows both your original wording and the improved version.
        </div>
        <form className="add-task-form" onSubmit={handleAddTask} style={{ display: "flex", gap: 10, marginBottom: 32 }}>
          <input
            type="text"
            value={input}
            placeholder="What do you need to do?"
            onChange={e => setInput(e.target.value)}
            disabled={adding}
            style={{
              flex: 1,
              padding: "13px 13px",
              fontSize: 17,
              borderRadius: 7,
              border: "1px solid var(--kavia-orange, #767676)"
            }}
            maxLength={120}
            aria-label="Add task"
          />
          <button className="btn btn-large" type="submit" disabled={adding || !input.trim()} style={{ fontWeight: 700 }}>
            {adding ? "Adding..." : "+ Add"}
          </button>
        </form>
        {error && <div style={{ color: "#ff6868", marginBottom: 18 }}>{error}</div>}
        <ol style={{ padding: 0, margin: 0, listStyle: "none" }}>
          {tasks.length === 0 && (
            <div style={{ color: "#aaa", fontSize: 17, marginTop: 33, textAlign: "center" }}>No tasks yet. Add your first one!</div>
          )}
          {tasks.map(t =>
            <li key={t.id} style={{
              background: "#fff",
              color: "#181818",
              borderRadius: 11,
              marginBottom: 22,
              boxShadow: "0 2px 10px 0 rgba(24,25,37,.10)",
              display: "flex",
              alignItems: "flex-start",
              padding: "18px 18px 16px 18px",
              position: "relative",
              opacity: t.completed ? 0.56 : 1,
              borderLeft: t.completed ? "6px solid #cccccc" : "6px solid var(--kavia-orange, #E87A41)"
            }}>
              <input
                type="checkbox"
                checked={t.completed}
                onChange={() => handleToggleComplete(t.id)}
                style={{
                  width: 22,
                  height: 22,
                  accentColor: "var(--kavia-orange, #E87A41)",
                  marginTop: 8
                }}
                aria-label={t.completed ? "Mark as incomplete" : "Mark as complete"}
                title={t.completed ? "Mark as incomplete" : "Mark as complete"}
              />
              <div style={{ flex: 1, marginLeft: 13, minWidth: 0 }}>
                {/* Edit mode */}
                {editId === t.id ? (
                  <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
                    <input
                      autoFocus
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      style={{
                        flex: 1,
                        fontSize: 17,
                        padding: "9px 10px",
                        border: "1px solid #afafaf",
                        borderRadius: 7
                      }}
                      maxLength={120}
                      aria-label="Edit task"
                      onKeyDown={e => {
                        if (e.key === "Enter") handleEditSave(t.id);
                        if (e.key === "Escape") handleEditCancel();
                      }}
                      disabled={loadingId === t.id}
                    />
                    <button
                      className="btn"
                      type="button"
                      disabled={loadingId === t.id}
                      style={{ background: "var(--kavia-orange, #E87A41)", color: "#fff", padding: "8px 18px", borderRadius: 8, fontWeight: 700, marginLeft: 3 }}
                      onClick={() => handleEditSave(t.id)}
                    >Save</button>
                    <button
                      className="btn"
                      type="button"
                      style={{ background: "#dae1e6", color: "#444", padding: "8px 12px", borderRadius: 8, marginLeft: 0 }}
                      onClick={handleEditCancel}
                    >Cancel</button>
                  </div>
                ) : (
                  <>
                    <div style={{
                      fontWeight: 600,
                      fontSize: 19,
                      textDecoration: t.completed ? "line-through" : undefined,
                      color: t.completed ? "#aaa" : "#222",
                      wordBreak: "break-word",
                      marginBottom: 2,
                    }}>{t.original}</div>
                    <div style={{
                      color: "#f48436",
                      fontSize: 15,
                      marginBottom: 3,
                      fontWeight: 500,
                      wordBreak: "break-word",
                      opacity: 0.95
                    }}>
                      {t.enhanced === null
                        ? (loadingId === t.id ? <span>Enhancing... <Spinner /></span> : <span style={{ color: "#aaa" }}>(waiting for AI...)</span>)
                        : t.enhanced}
                    </div>
                  </>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginLeft: 14, minWidth: 48 }}>
                {editId == null && (
                  <>
                    <button
                      className="btn"
                      onClick={() => handleEdit(t.id, t.original)}
                      aria-label="Edit"
                      title="Edit"
                      style={{ background: "#fff2ee", color: "#E87A41", fontWeight: 700, borderRadius: "50%", width: 36, height: 36, padding: 0, fontSize: 19, border: "1.6px solid #ffcdb7" }}>
                      ✎
                    </button>
                    <button
                      className="btn"
                      onClick={() => handleDelete(t.id)}
                      aria-label="Delete"
                      title="Delete"
                      style={{ background: "#f44336", color: "#fff", borderRadius: "50%", width: 36, height: 36, padding: 0, fontSize: 20 }}>
                      🗑
                    </button>
                  </>
                )}
              </div>
            </li>
          )}
        </ol>
      </main>
      <footer style={{ textAlign: "center", color: "#bdbdbd", margin: "42px 0 10px 0", fontSize: 14 }}>
        Smart To-Do List &copy; {new Date().getFullYear()} <span style={{ color: "#26d9ff" }}>AI powered</span>
      </footer>
    </div>
  );
}

// PUBLIC_INTERFACE
function Spinner() {
  return (
    <span style={{
      display: "inline-block",
      width: "14px",
      height: "14px",
      border: "2.3px solid #e99441",
      borderTop: "2.3px solid #fff",
      borderRadius: "50%",
      verticalAlign: "middle",
      marginRight: 4,
      animation: "spin 1s linear infinite"
    }} />
  );
}

// CSS for spinner animation (could go in App.css, here for self-containment)
const styleTag = document.createElement("style");
styleTag.innerHTML = `
@keyframes spin {
  to { transform: rotate(360deg);}
}
`;
document.head.appendChild(styleTag);

export default App;
