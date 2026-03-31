# Shared Components

Reusable UI components for the faculty frontend.

## Components

### LoadingSpinner

**Location:** `components/shared/LoadingSpinner.jsx`

Loading indicator with multiple sizes and full-screen overlay option.

**Usage:**

```jsx
import LoadingSpinner from "../components/shared/LoadingSpinner";

<LoadingSpinner size="medium" message="Loading..." />
<LoadingSpinner size="large" fullScreen message="Loading dashboard..." />
```

**Props:**

- `size` (string): 'small' | 'medium' | 'large' (default: 'medium')
- `message` (string): Optional loading message
- `fullScreen` (boolean): Render as full-screen overlay (default: false)

---

### Toast & ToastContainer

**Location:** `components/shared/Toast.jsx` & `ToastContainer.jsx`

Notification system for success/error/info messages.

**Usage:**

```jsx
import ToastContainer from "../components/shared/ToastContainer";

// In your component state:
const [toasts, setToasts] = useState([]);

const showToast = (message, type = "info") => {
  const id = Date.now();
  setToasts((prev) => [...prev, { id, message, type, show: true }]);
  setTimeout(() => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, 5000);
};

// In render:
<ToastContainer
  toasts={toasts}
  onRemove={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
/>;
```

**Toast Types:** 'success', 'error', 'warning', 'info'

---

### Modal

**Location:** `components/shared/Modal.jsx`

Accessible modal dialog with keyboard navigation and focus management.

**Usage:**

```jsx
import Modal from "../components/shared/Modal";

<Modal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Create Course"
  size="medium"
>
  <form>...</form>
</Modal>;
```

**Props:**

- `isOpen` (boolean): Whether modal is open
- `onClose` (Function): Close handler
- `title` (string): Modal title
- `children` (ReactNode): Modal content
- `size` (string): 'small' | 'medium' | 'large' | 'full' (default: 'medium')
- `closeOnOverlayClick` (boolean): Default true
- `showCloseButton` (boolean): Default true

---

### StatCard

**Location:** `components/shared/StatCard.jsx`

Statistic display card with icon and label.

**Usage:**

```jsx
import StatCard from "../components/shared/StatCard";

<StatCard
  value={42}
  label="Total Courses"
  icon="bx-book"
  variant="info"
  onClick={() => navigate("/faculty/courses")}
/>;
```

**Props:**

- `value` (string|number): Statistic value
- `label` (string): Statistic label
- `icon` (string): Boxicons class (e.g., 'bx-book')
- `variant` (string): 'default' | 'success' | 'warning' | 'error' | 'info'
- `onClick` (Function): Optional click handler
- `loading` (boolean): Show loading state

---

## Faculty-Specific Components

### TopNav

**Location:** `components/faculty/TopNav.jsx`

Top navigation bar for faculty dashboard.

**Usage:**

```jsx
import TopNav from "../components/faculty/TopNav";

<TopNav profile={facultyProfile} onLogout={handleLogout} />;
```

### Sidebar

**Location:** `components/faculty/Sidebar.jsx`

Sidebar navigation for faculty dashboard.

**Usage:**

```jsx
import Sidebar from "../components/faculty/Sidebar";

<Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />;
```

---

## Styling

All components use CSS Modules with dark mode support via `.darkMode` class on body/document.

CSS variables are used for theming:

- `--primary-color`: Primary brand color
- `--bg-primary`: Background color
- `--text-primary`: Text color
- `--border-color`: Border color
- etc.

Add dark mode by adding `darkMode` class to body:

```js
document.body.classList.add("darkMode");
```



