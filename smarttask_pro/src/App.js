import React, { useState, useRef } from 'react';
import './App.css';

/**
 * SmartTask Pro - Main Container
 * Features:
 * - Task CRUD (create, read, update, delete, mark complete/incomplete)
 * - Reminders and categories
 * - Progress tracking/statistics
 * - Search & filter
 * - Light theme, modern UI, with sidebar, topbar, modals
 * - Color scheme: primary (#1976D2), secondary (#424242), accent (#FFC107)
 */

// THEME CONSTANTS
const COLORS = {
  primary: '#1976D2',
  secondary: '#424242',
  accent: '#FFC107',
  background: '#f7fafd',
  light: '#fff',
  text: '#181818',
  border: '#e0e0e0'
};

// Dummy default categories
const DEFAULT_CATEGORIES = [
  { id: 'all', name: 'All', color: COLORS.primary },
  { id: 'work', name: 'Work', color: '#E57373' },
  { id: 'personal', name: 'Personal', color: '#81C784' },
  { id: 'urgent', name: 'Urgent', color: COLORS.accent }
];

const initialTasks = [
  { id: 1, title: "Finish React task", notes: "UI, logic & modals", completed: false, category: "work", reminder: null, created: new Date(), updated: new Date() },
  { id: 2, title: "Grocery shopping", notes: "Get milk & bread", completed: false, category: "personal", reminder: null, created: new Date(), updated: new Date() },
  { id: 3, title: "Check email", notes: "", completed: true, category: "work", reminder: null, created: new Date(), updated: new Date() },
  { id: 4, title: "Doctor Appointment", notes: "Fri 10am", completed: false, category: "urgent", reminder: null, created: new Date(), updated: new Date() }
];

// ---------------------------------------------
// PUBLIC_INTERFACE (Main App)

function App() {
  // STATE
  const [tasks, setTasks] = useState(initialTasks);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddEditModalOpen, setAddEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null); // if present, edit; else add
  const [isRemindersOpen, setRemindersOpen] = useState(false);
  // For simple local reminders, only show upcoming tasks with reminders (if any)
  const modalInitialFocusRef = useRef(null);

  // Filtered and Searched Tasks
  const filteredTasks = tasks.filter(task => (
    (selectedCategory === 'all' || task.category === selectedCategory) &&
    (searchQuery.trim().length === 0 ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.notes && task.notes.toLowerCase().includes(searchQuery.toLowerCase())))
  ));

  // Progress Stats
  const completedCount = filteredTasks.filter(t => t.completed).length;
  const totalCount = filteredTasks.length;
  const percentComplete = totalCount !== 0 ? Math.round(100 * completedCount / totalCount) : 0;

  // Reminders: tasks with reminders that are not completed & time is in future
  const upcomingReminders = tasks.filter(task =>
    task.reminder &&
    !task.completed &&
    new Date(task.reminder) > new Date()
  )
  .sort((a, b) => new Date(a.reminder) - new Date(b.reminder));

  // --- TASK CRUD HANDLERS ---
  // PUBLIC_INTERFACE
  function addTask(task) {
    setTasks(prev => [
      ...prev,
      {
        ...task,
        id: Date.now(),
        created: new Date(),
        updated: new Date()
      }
    ]);
  }
  // PUBLIC_INTERFACE
  function updateTask(editedTask) {
    setTasks(prev => prev.map(t => (
      t.id === editedTask.id ? { ...editedTask, updated: new Date() } : t
    )));
  }
  // PUBLIC_INTERFACE
  function deleteTask(id) {
    setTasks(prev => prev.filter(t => t.id !== id));
  }
  // PUBLIC_INTERFACE
  function toggleComplete(id) {
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, completed: !t.completed, updated: new Date() } : t
    ));
  }
  // PUBLIC_INTERFACE
  function addCategory(name, color) {
    const id = name
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .slice(0, 30);
    setCategories(prev => [
      ...prev,
      {
        id,
        name,
        color: color || '#888888'
      }
    ]);
  }

  // --- MODAL HANDLERS ---
  function openAddTaskModal() {
    setEditingTask(null);
    setAddEditModalOpen(true);
    setTimeout(() => {
      if (modalInitialFocusRef.current) modalInitialFocusRef.current.focus();
    }, 50);
  }
  function openEditTaskModal(task) {
    setEditingTask(task);
    setAddEditModalOpen(true);
    setTimeout(() => {
      if (modalInitialFocusRef.current) modalInitialFocusRef.current.focus();
    }, 50);
  }
  function closeModal() {
    setAddEditModalOpen(false);
    setEditingTask(null);
  }

  // --- CATEGORY HANDLER ---
  function handleCategorySelect(id) {
    setSelectedCategory(id);
  }

  // --- SEARCH HANDLER ---
  function handleSearchChange(e) {
    setSearchQuery(e.target.value);
  }

  // --- RENDER ---
  return (
    <div
      className="app"
      style={{
        background: COLORS.background,
        color: COLORS.text,
        minHeight: "100vh"
      }}
    >
      <TopBar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onAddTask={openAddTaskModal}
        openRemindersPanel={() => setRemindersOpen(true)}
        colors={COLORS}
      />

      <div style={{
        display: "flex",
        flexDirection: "row",
        maxWidth: 1200,
        margin: "80px auto 0 auto",
        boxShadow: `0 2px 16px 0 rgba(0,0,0,.07)`,
        borderRadius: 18,
        overflow: "hidden",
        background: COLORS.light,
        minHeight: 640
      }}>
        <Sidebar
          categories={categories}
          selectedId={selectedCategory}
          onSelect={handleCategorySelect}
          onAddCategory={addCategory}
          colors={COLORS}
        />
        <main style={{ flex: 2, minWidth: 0, background: "#f7fafd" }}>
          <div style={{ padding: "38px 32px 0 32px" }}>
            <ProgressStatistics percent={percentComplete} completed={completedCount} total={totalCount} colors={COLORS} />
            <TaskList
              tasks={filteredTasks}
              onEditTask={openEditTaskModal}
              onDeleteTask={deleteTask}
              onToggleComplete={toggleComplete}
              categories={categories}
              colors={COLORS}
            />
          </div>
        </main>
      </div>

      {isAddEditModalOpen && (
        <TaskModal
          open={isAddEditModalOpen}
          onClose={closeModal}
          onAdd={addTask}
          onEdit={updateTask}
          editingTask={editingTask}
          categories={categories}
          initialFocusRef={modalInitialFocusRef}
          colors={COLORS}
        />
      )}

      {isRemindersOpen && (
        <RemindersPanel
          open={isRemindersOpen}
          reminders={upcomingReminders}
          onClose={() => setRemindersOpen(false)}
          categories={categories}
          colors={COLORS}
        />
      )}

      {/* Light footer */}
      <footer style={{ textAlign: "center", color: "#bdbdbd", margin: "36px 0 16px 0", fontSize: 14 }}>
        SmartTask Pro &copy; 2024
      </footer>
    </div>
  );
}

// -------------------------------
// SIDEBAR
function Sidebar({ categories, selectedId, onSelect, onAddCategory, colors }) {
  const [isAdding, setAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  // PUBLIC_INTERFACE
  function handleAdd() {
    if (!newCatName.trim()) return;
    onAddCategory(newCatName, undefined);
    setNewCatName('');
    setAdding(false);
  }
  return (
    <aside style={{
      width: 220,
      background: "#f3f6fa",
      borderRight: `1px solid ${colors.border}`,
      padding: 0,
      minHeight: "100%",
      display: "flex",
      flexDirection: "column"
    }}>
      <div style={{ fontWeight: 600, fontSize: 18, color: colors.primary, textAlign: "center", padding: "36px 8px 20px 8px" }}>
        Categories
      </div>
      <ul style={{ flex: 1, padding: 0, margin: 0, listStyle: "none" }}>
        {categories.map(cat =>
          <li key={cat.id}>
            <button
              onClick={() => onSelect(cat.id)}
              style={{
                width: "94%",
                margin: "4px 0 4px 3%",
                padding: "10px 12px",
                border: 0,
                background: selectedId === cat.id ? colors.primary : "#f3f6fa",
                color: selectedId === cat.id ? "#fff" : "#333",
                borderRadius: 7,
                textAlign: "left",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <span style={{
                display: "inline-block",
                background: cat.color,
                width: 14, height: 14, borderRadius: 3,
                marginRight: 7,
                verticalAlign: "middle"
              }}></span>
              {cat.name}
            </button>
          </li>
        )}
      </ul>
      <div style={{ padding: "0 15px 20px 15px" }}>
        {isAdding ? (
          <form
            style={{ display: "flex", gap: 7 }}
            onSubmit={e => { e.preventDefault(); handleAdd(); }}>
            <input
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              type="text"
              placeholder="New Category"
              maxLength={24}
              autoFocus
              style={{ flex: 1, padding: 6, borderRadius: 4, border: "1px solid #ccc", background: "#fff" }}
            />
            <button
              title="Add"
              style={{ background: colors.accent, border: 0, borderRadius: 4, color: "#fff", padding: "0 9px", fontWeight: 600 }}
              type="submit"
            >+</button>
            <button
              type="button"
              aria-label="Cancel"
              style={{ color: "#888", background: "none", border: 0, fontSize: 20, marginLeft: -2 }}
              onClick={() => { setAdding(false); setNewCatName(''); }}>×</button>
          </form>
        ) : (
          <button className="btn" onClick={() => setAdding(true)}
            style={{ background: colors.secondary, color: "#fff", fontWeight: 600, width: "100%", borderRadius: 5, padding: "8px 0", fontSize: 15 }}>
            + Add Category
          </button>
        )}
      </div>
    </aside>
  );
}

// -------------------------------
// TOP BAR
function TopBar({ searchQuery, onSearchChange, onAddTask, openRemindersPanel, colors }) {
  return (
    <header className="navbar" style={{
      background: colors.primary, color: "#fff", position: "fixed", width: "100%",
      top: 0, left: 0, zIndex: 100, minHeight: 64, borderBottom: "2px solid #174a8b"
    }}>
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="logo" style={{ color: "#fff", fontWeight: 700, fontSize: 22 }}>
          <span style={{ color: colors.accent, fontWeight: 800, fontSize: 25, marginRight: 8 }}>★</span>
          SmartTask Pro
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 18, marginLeft: 40 }}>
          <input
            type="text"
            placeholder="Search tasks…"
            value={searchQuery}
            onChange={onSearchChange}
            style={{
              border: 0,
              borderRadius: 7,
              padding: "9px 16px",
              fontSize: 16,
              background: "#fff",
              color: "#222",
              minWidth: 210,
              boxShadow: "0 0 0 1px #eee",
              marginRight: 8
            }}
          />
          <button onClick={onAddTask} className="btn" style={{ background: colors.accent, color: "#111", borderRadius: 7, fontWeight: 600 }}>+ Task</button>
          <button
            onClick={openRemindersPanel}
            className="btn"
            aria-label="Show Reminders"
            title="Show Reminders"
            style={{
              background: "#fff", color: colors.primary, borderRadius: "50%",
              width: 38, height: 38, textAlign: "center", padding: 0, fontSize: 21,
              fontWeight: 600, marginLeft: 10, border: "1px solid #e4eaff"
            }} >
            <span role="img" aria-label="Reminders">⏰</span>
          </button>
        </div>
      </div>
    </header>
  );
}

// -------------------------------
// TASK LIST & TASK ITEM
function TaskList({ tasks, onEditTask, onDeleteTask, onToggleComplete, categories, colors }) {
  if (tasks.length === 0) {
    return <div style={{ textAlign: "center", fontWeight: 500, color: "#bbb", paddingTop: 38, fontSize: 18 }}>No tasks found.</div>
  }
  return (
    <div>
      <h2 style={{ fontWeight: 600, fontSize: 28, margin: "0 0 18px 0", color: colors.primary }}>Tasks</h2>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {tasks.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            onEdit={() => onEditTask(task)}
            onDelete={() => onDeleteTask(task.id)}
            onToggleComplete={() => onToggleComplete(task.id)}
            category={categories.find(cat => cat.id === task.category)}
            colors={colors}
          />
        ))}
      </ul>
    </div>
  );
}

function TaskItem({ task, onEdit, onDelete, onToggleComplete, category, colors }) {
  // Show reminder time if available
  return (
    <li style={{
      background: "#fff",
      borderRadius: 11,
      marginBottom: 17,
      boxShadow: "0 2px 12px 0 rgba(24,25,37,.06)",
      display: "flex",
      alignItems: "flex-start",
      padding: "18px 20px 15px 20px",
      borderLeft: `6px solid ${category?.color || colors.primary}`,
      opacity: task.completed ? 0.65 : 1
    }}>
      <input
        type="checkbox"
        checked={task.completed}
        onChange={onToggleComplete}
        style={{ width: 20, height: 20, accentColor: colors.primary, marginTop: 4 }}
        aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
        title={task.completed ? "Mark as incomplete" : "Mark as complete"}
      />
      <div style={{ flex: 1, marginLeft: 14 }}>
        <div style={{
          fontWeight: 600,
          fontSize: 19,
          textDecoration: task.completed ? "line-through" : undefined,
          color: "#262a33"
        }}>{task.title}
          <span style={{
            background: category?.color || colors.secondary,
            color: "#fff", borderRadius: 5, fontSize: 11,
            padding: "2px 8px", marginLeft: 9, verticalAlign: "top"
          }}>
            {category?.name}
          </span>
        </div>
        {task.notes && (
          <div style={{ color: "#7a7a7a", fontSize: 15, marginTop: 3 }}>{task.notes}</div>
        )}
        {task.reminder && (
          <div style={{ fontSize: 13, color: colors.accent, fontWeight: 500, marginTop: 3 }}>
            ⏰ Reminds at {new Date(task.reminder).toLocaleString()}
          </div>
        )}
        <div style={{ marginTop: 10, fontSize: 13, color: "#b5b5be" }}>
          Created: {new Date(task.created).toLocaleDateString()}
          {task.updated && <span> · Updated: {new Date(task.updated).toLocaleDateString()}</span>}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginLeft: 14 }}>
        <button
          className="btn"
          onClick={onEdit}
          aria-label="Edit"
          title="Edit"
          style={{
            background: colors.primary,
            color: "#fff", borderRadius: "50%", width: 34, height: 34, padding: 0, fontSize: 17, marginBottom: 1
          }}>
          ✎
        </button>
        <button
          className="btn"
          onClick={onDelete}
          aria-label="Delete"
          title="Delete"
          style={{
            background: "#f44336",
            color: "#fff", borderRadius: "50%", width: 34, height: 34, padding: 0, fontSize: 19
          }}>
          🗑
        </button>
      </div>
    </li>
  );
}

// -------------------------------
// TASK MODAL (ADD/EDIT)
function TaskModal({ open, onClose, onAdd, onEdit, editingTask, categories, initialFocusRef, colors }) {
  const [title, setTitle] = useState(editingTask ? editingTask.title : '');
  const [notes, setNotes] = useState(editingTask ? editingTask.notes : '');
  const [category, setCategory] = useState(editingTask ? editingTask.category : categories[1]?.id || 'work');
  const [reminder, setReminder] = useState(editingTask && editingTask.reminder ? editingTask.reminder.slice(0, 16) : '');
  // PUBLIC_INTERFACE
  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    const taskData = {
      ...editingTask,
      title: title.trim(),
      notes: notes.trim(),
      category,
      reminder: reminder ? new Date(reminder).toISOString() : null,
      completed: editingTask ? editingTask.completed : false
    };
    if (editingTask) {
      onEdit(taskData);
    } else {
      onAdd(taskData);
    }
    onClose();
  }
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      background: "rgba(0,0,0,0.2)", zIndex: 300,
      display: "flex", alignItems: "center", justifyContent: "center"
    }}
      tabIndex={-1}
      aria-modal="true"
      onClick={onClose}
    >
      <form
        autoComplete="off"
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          minWidth: 320, maxWidth: 400,
          borderRadius: 11, boxShadow: "0 4px 32px 0 rgba(21,31,61,.17)",
          padding: "35px 30px 28px 30px",
          display: "flex",
          flexDirection: "column",
          gap: 17,
          position: "relative"
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          position: "absolute", right: 20, top: 16, fontSize: 25,
          color: "#b6b6c6", cursor: "pointer"
        }} tabIndex={0}
          aria-label="Close"
          onClick={onClose}
        >×</div>
        <h3 style={{ marginBottom: 2, fontWeight: 700, color: colors.primary }}>
          {editingTask ? "Edit Task" : "Add Task"}
        </h3>
        <input
          ref={initialFocusRef}
          required
          autoFocus
          placeholder="Task title"
          maxLength={48}
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ padding: "10px 12px", borderRadius: 7, border: "1px solid #a6b2d2", fontSize: 17 }}
        />
        <textarea
          placeholder="Notes (optional)"
          maxLength={100}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          style={{ padding: "9px 12px", borderRadius: 6, border: "1px solid #d0d0e6", fontSize: 15, minHeight: 44 }}
        />
        <div style={{ display: "flex", gap: 10 }}>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            style={{ flex: 1, padding: "9px 8px", borderRadius: 6, border: "1px solid #c9cedc", fontSize: 15 }}
          >
            {categories.filter(c => c.id !== "all").map(cat =>
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            )}
          </select>
          <input
            type="datetime-local"
            value={reminder}
            onChange={e => setReminder(e.target.value)}
            style={{ flex: 1.5, padding: "8px", borderRadius: 6, border: "1px solid #dedede", fontSize: 15 }}
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>
        <button
          type="submit"
          className="btn btn-large"
          style={{ background: colors.accent, color: "#181818", border: 0, borderRadius: 7, fontWeight: 700, fontSize: 17 }}>
          {editingTask ? "Save" : "Add"}
        </button>
      </form>
    </div>
  );
}

// -------------------------------
// PROGRESS STATS
function ProgressStatistics({ percent, completed, total, colors }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 19, marginBottom: 34 }}>
      <div style={{ fontWeight: 600, color: COLORS.secondary, fontSize: 15 }}>
        Progress: {completed}/{total}
      </div>
      <div style={{ flex: 1, height: 19, background: "#eaeaea", borderRadius: 7, overflow: "hidden" }}>
        <div style={{
          background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})`,
          width: `${percent}%`, height: "100%",
          transition: "width .36s", borderRadius: 7
        }} />
      </div>
      <div style={{ color: colors.primary, fontWeight: 700, fontSize: 15 }}>{percent}%</div>
    </div>
  );
}

// -------------------------------
// REMINDERS PANEL
function RemindersPanel({ open, reminders, onClose, categories, colors }) {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      background: "rgba(0,0,0,0.24)", zIndex: 400,
      display: "flex", alignItems: "center", justifyContent: "center"
    }}
      tabIndex={-1}
      aria-modal="true"
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          minWidth: 320,
          maxWidth: 420,
          borderRadius: 12,
          boxShadow: "0 6px 24px 0 rgba(21,31,61,.24)",
          padding: "34px 20px 29px 23px",
          position: "relative"
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          position: "absolute", right: 18, top: 13, fontSize: 22,
          color: "#b1b1be", cursor: "pointer"
        }} tabIndex={0}
          aria-label="Close"
          onClick={onClose}
        >×</div>
        <h3 style={{ margin: 0, color: colors.primary, fontWeight: 700 }}>
          Upcoming Reminders
        </h3>
        <ol style={{ margin: "23px 0 0 9px", padding: 0 }}>
          {reminders.length === 0 ?
            <div style={{ color: "#bbb", fontWeight: 500, fontSize: 16, marginTop: 11 }}>
              No upcoming reminders.
            </div>
            : reminders.map(t => (
              <li key={t.id} style={{ marginBottom: 14, fontSize: 16, color: "#272a2e" }}>
                <span style={{
                  display: "inline-block", width: 12, height: 12,
                  background: categories.find(c => c.id === t.category)?.color || "#aac",
                  borderRadius: 3, marginRight: 7,
                }} />
                <span style={{ fontWeight: 600, marginRight: 8 }}>{t.title}</span>
                <span style={{ color: colors.accent, fontWeight: 500, marginLeft: 4 }}>
                  at {new Date(t.reminder).toLocaleString()}
                </span>
                <span style={{
                  fontSize: 11, padding: "1px 6px", background: "#ececec",
                  borderRadius: 4, color: "#777", marginLeft: 10
                }}>
                  {categories.find(c => c.id === t.category)?.name || ""}
                </span>
              </li>
            ))
          }
        </ol>
      </div>
    </div>
  );
}

export default App;
