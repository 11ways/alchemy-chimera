# Alchemy Chimera Development Guide

## Overview

Chimera is the admin/CMS interface plugin for AlchemyMVC. It provides a complete backend administration interface for managing application data models with CRUD operations, live task monitoring, and system settings management.

## Commands
- Run tests: `npm test`

## Dependencies
- alchemymvc (>=1.4.0-alpha)
- alchemy-acl (~0.9.0-alpha) - Access control
- alchemy-form (~0.3.0-alpha) - Form handling
- alchemy-widget (~0.3.0-alpha) - Widget system
- alchemy-styleboost (>=0.5.0-alpha) - SCSS framework

## Directory Structure

```
controller/
├── 00-chimera_controller.js         # Base controller
├── chimera_editor_controller.js     # CRUD interface
├── chimera_settings_controller.js   # Settings management
├── chimera_static_controller.js     # Dashboard/sidebar
└── system_task_controller.js        # Task execution/monitoring

lib/
└── chimera_config.js                # Model configuration class

model/
└── model.js                         # Adds chimera property to models

element/
├── chimera_run_task_button.js       # Task execution button
└── chimera_task_monitor.js          # Live task progress UI

view/
├── chimera/
│   ├── dashboard.hwk
│   ├── sidebar.hwk
│   ├── editor/                      # CRUD views
│   └── settings/
└── layouts/
    └── chimera_*.hwk
```

## Routes

All routes require `'chimera'` permission and are prefixed with `/chimera`.

| Route | Method | Handler | Description |
|-------|--------|---------|-------------|
| `/` | GET | `Chimera.Static#dashboard` | Dashboard |
| `/settings` | GET/POST | `Chimera.Settings#editor` | System settings |
| `/editor/{model}/index` | GET | `Chimera.Editor#index` | List records |
| `/editor/{model}/add` | GET/POST | `Chimera.Editor#add` | Create record |
| `/editor/{model}/edit/{pk}` | GET/POST | `Chimera.Editor#edit` | Edit record |
| `/editor/{model}/trash/{pk}` | GET/POST | `Chimera.Editor#trash` | Delete record |
| `/editor/{model}/preview/{pk}` | GET | `Chimera.Editor#preview` | Preview record |
| `/task-monitor/{task_history_id}` | GET | `Chimera.Editor#taskMonitor` | Task monitor page |

### API Routes
| Route | Method | Handler |
|-------|--------|---------|
| `/api/editor/{model}/records` | POST | Fetch paginated records |
| `/api/content/sidebar` | GET | Dynamic sidebar content |
| `/api/system/task/{id}/run` | POST | Execute system task |

### WebSocket Linkups
- `chimera@taskmonitor` - Live task monitoring

## Model Configuration

Every model has a static `chimera` property (ChimeraConfig instance):

### Field Sets

Define which fields appear in different contexts:

```javascript
// In model constitute() or after model definition
const MyModel = Model.getClass('MyModel');

// Edit form fields
MyModel.chimera.getFieldSet('edit')
    .add('title', {group: 'main'})
    .add('body', {group: 'content'})
    .add('status', {group: 'settings'});

// List/table fields
MyModel.chimera.getFieldSet('list')
    .add('title')
    .add('status')
    .add('created');
```

### Field Options
```javascript
{
    title: 'Field Title',      // Display name
    purpose: 'default',        // Field purpose for form
    mode: 'default',           // Edit mode
    readonly: false,           // Read-only field
    view: 'default',           // View template
    wrapper: 'default',        // Wrapper template
    group: 'main',             // Tab group (multiple = tabs)
    widget_settings: {}        // Widget-specific config
}
```

### Row Actions

Add custom actions to record rows:

```javascript
MyModel.chimera.addRowAction({
    name: 'publish',
    icon: 'share',
    title: 'Publish',
    placement: ['row', 'context'],  // Where to show
    route: 'PublishController#publish',
    route_params: {
        pk: '$pk',      // Auto-substituted with record primary key
        type: 'article'
    }
});
```

Built-in actions: `edit`, `trash`

### Record Preview

```javascript
MyModel.chimera.setRecordPreview('MyController#preview');
```

## Widget Generation

Chimera auto-generates UI based on field sets:

### Edit Action
- Single group → Flat form
- Multiple groups → Tab navigation
- Includes save button with states (default, busy, done, error)

### List Action
- `<alchemy-table>` with pagination
- Filter row for searching
- Sortable columns
- Configurable page size

## Task Monitoring

### Run Task Button
```html
<chimera-run-task-button task-id="{{task.$pk}}">
    Run Task
</chimera-run-task-button>
```

### Task Monitor Element
```html
<chimera-task-monitor task-history-id="{{history.$pk}}">
</chimera-task-monitor>
```

Features:
- Real-time progress via WebSocket
- Log output with timestamps
- Controls: Stop, Pause, Resume
- Status display with elapsed time
- Error handling with fallback to database state

### Linkup Events
| From Server | Description |
|-------------|-------------|
| `state` | Initial state |
| `progress` | Percentage updates |
| `report` | Log entries |
| `complete` | Task finished |
| `paused`, `resumed`, `stopped` | Control confirmations |
| `error` | Error occurred |

| To Server | Description |
|-----------|-------------|
| `stop` | Stop running task |
| `pause` | Pause task |
| `resume` | Resume paused task |

## Records API

**POST `/chimera/api/editor/{model}/records`**

Request:
```javascript
{
    page_size: 20,
    page: 1,
    fields: ['title', 'status'],
    sort: {field: 'created', dir: 'desc'},
    filters: {status: 'published'}
}
```

Response:
```javascript
{
    records: [{
        // Record data
        $hold: {
            actions: [{name: 'edit', icon, url, placement}]
        }
    }]
}
```

## Sidebar Configuration

Auto-generated from models with Chimera configuration, or customize:

```javascript
alchemy.plugins.chimera.sidebar_menu = [
    {model: 'Article'},           // Auto-generate link
    {model: 'User'},
    {href: '/custom', title: 'Custom Page'}
];
```

## Plugin Configuration

```javascript
alchemy.plugins.chimera = {
    theme: 'custom-theme',        // Custom theme name
    title: 'My Admin',            // Window title prefix
    sidebar_menu: [...]           // Custom sidebar (optional)
};
```

## Controllers

### ChimeraController (Base)
- Sets theme on HTTP requests
- Manages toolbar for document editing
- Provides `setTitle(title)` method

### ChimeraEditor
- `index` - Record list with table
- `add` - Create form
- `edit` - Edit form with document watching
- `trash` - Delete confirmation
- `preview` - Delegates to model's preview action
- `records` - API for fetching records

### ChimeraSettings
- `editor` - System settings form

### SystemTask
- `run` - Execute task manually
- `monitor` - WebSocket handler for live updates

## View Templates

Templates use Hawkejs (`.hwk` files):

- `chimera/dashboard.hwk` - Main dashboard
- `chimera/sidebar.hwk` - Navigation
- `chimera/editor/index.hwk` - Record list
- `chimera/editor/add.hwk` - Create form
- `chimera/editor/edit.hwk` - Edit form
- `chimera/editor/trash.hwk` - Delete confirmation
- `chimera/editor/task_monitor.hwk` - Task progress
- `chimera/settings/editor.hwk` - Settings form

## Utility

```javascript
// Convert model name to URL segment
Plugin.modelNameToUrl('MyModel');  // 'my_model'
```

## Gotchas

1. **Permission required:** All Chimera routes require `'chimera'` permission

2. **Field sets:** Models need `getFieldSet('edit')` configured to appear in admin

3. **has_configuration:** Models only show in sidebar if `chimera.has_configuration` is true

4. **Group tabs:** Multiple groups in edit fieldset automatically creates tabbed interface

5. **WebSocket skip:** Theme/beforeAction skipped for WebSocket connections

6. **Document watching:** Edit page uses toolbar manager for tracking document changes

7. **Private fields:** Call `record.keepPrivateFields()` to preserve sensitive data in responses

8. **Row action $pk:** Use `$pk` in route_params to substitute record's primary key
