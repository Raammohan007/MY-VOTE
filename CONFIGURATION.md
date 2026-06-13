# ⚙️ CONFIGURATION & CUSTOMIZATION GUIDE

This guide helps you customize the voting system to match your tuition center's needs.

---

## 🔐 ADMIN PIN CONFIGURATION

### Change Admin PIN

**File**: `src/components/AdminLogin.js`

Find this line:
```javascript
<AdminLogin 
  onAdminSuccess={handleAdminLoginSuccess}
  onBack={handleBackHome}
  correctPin="1234"  // <-- CHANGE THIS
/>
```

Replace `"1234"` with your desired PIN:
```javascript
correctPin="5678"  // Your new PIN
```

### PIN Rules
- Must be 4-6 digits
- Numbers only
- Share only with trusted admins

---

## 🎨 CUSTOMIZE COLORS

### Change Background Gradient

**File**: `src/styles/components.css`

Search for `background: linear-gradient(135deg,` and replace colors:

**Current colors** (purple gradient):
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

**Example palettes**:

**Blue Gradient**:
```css
background: linear-gradient(135deg, #667eea 0%, #0984e3 100%);
```

**Green Gradient**:
```css
background: linear-gradient(135deg, #38ada9 0%, #079992 100%);
```

**Orange Gradient**:
```css
background: linear-gradient(135deg, #ff9f43 0%, #f76707 100%);
```

**Pink Gradient**:
```css
background: linear-gradient(135deg, #ee5a6f 0%, #c44569 100%);
```

### Change Button Colors

Search for `.start-btn`, `.submit-btn`, etc. and modify:

```css
background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
```

---

## 📝 ADD OR MODIFY ROLES

### Edit Grade Structure

**File**: `src/utils/votingData.js`

Find the `getRolesForGrade` function and modify:

**Current structure** (example for Grade 9):
```javascript
if (grade_num >= 6 && grade_num <= 10) {
  return [
    { id: 'boyRep', label: 'Boy Class Representative', category: 'classRep' },
    { id: 'girlRep', label: 'Girl Class Representative', category: 'classRep' }
  ];
}
```

**Add a new position** (example - add Sports Captain):
```javascript
if (grade_num >= 6 && grade_num <= 10) {
  return [
    { id: 'boyRep', label: 'Boy Class Representative', category: 'classRep' },
    { id: 'girlRep', label: 'Girl Class Representative', category: 'classRep' },
    { id: 'sportsCap', label: 'Sports Captain', category: 'sports' }
  ];
}
```

### Add/Remove Grades

To add Grade 13 or remove Grade 6:

**In `GRADES` constant**:
```javascript
export const GRADES = ['6', '7', '8', '9', '10', '11', '12', '13']; // Add '13'
```

**Then add its roles**:
```javascript
else if (grade_num === 13) {
  return [
    { id: 'president', label: 'Student President', category: 'leadership' },
    { id: 'vicePresident', label: 'Vice President', category: 'leadership' }
  ];
}
```

---

## 👥 STUDENT GROUPS CONFIGURATION

### Add New Groups (Beyond Science/Commerce)

**File**: `src/utils/votingData.js`

Change:
```javascript
export const GROUPS = ['Science', 'Commerce'];
```

To:
```javascript
export const GROUPS = ['Science', 'Commerce', 'Humanities', 'Vocational'];
```

### Apply Groups to Different Grades

Currently groups apply to grades 11+. To change:

**File**: `src/utils/votingData.js`

Find `hasGroups` function:
```javascript
export const hasGroups = (grade) => {
  return parseInt(grade) >= 11;  // Change 11 to your preference
};
```

To apply groups to grades 10+:
```javascript
export const hasGroups = (grade) => {
  return parseInt(grade) >= 10;
};
```

---

## 🎨 CANDIDATE CARD STYLING

### Change Card Layout

**File**: `src/styles/components.css`

Find `.candidates-grid`:
```css
.candidates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 20px;
}
```

**Make cards larger**:
```css
grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
```

**Make cards smaller**:
```css
grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
```

**Display in 2 columns**:
```css
grid-template-columns: repeat(2, 1fr);
```

---

## 📊 DASHBOARD CUSTOMIZATION

### Change Chart Colors

**File**: `src/components/AdminDashboard.js`

Find this in chart data:
```javascript
backgroundColor: [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
  '#FF9F40', '#FF6384', '#C9CBCF'
],
```

Replace with your colors:
```javascript
backgroundColor: [
  '#667eea', '#764ba2', '#38ada9', '#ff9f43', '#ee5a6f',
  '#0984e3', '#6c5ce7', '#a29bfe'
],
```

### Change Ranking Badge Colors

**File**: `src/styles/components.css`

Find `.rank-bar-fill`:
```css
background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
```

Change to your colors:
```css
background: linear-gradient(90deg, #28a745 0%, #20c997 100%);
```

---

## 📱 RESPONSIVE DESIGN

### Adjust Mobile Layout

**File**: `src/styles/components.css`

Find `@media (max-width: 768px)` and modify:

**Change breakpoint**:
```css
@media (max-width: 1024px) {  /* Change from 768px */
  /* Mobile styles */
}
```

**Adjust candidate cards per row**:
```css
.candidates-grid {
  grid-template-columns: repeat(2, 1fr);  /* More/less cards per row */
}
```

---

## 🔤 CHANGE APP NAME

### Update Branding

**File**: `src/components/Home.js`

Change:
```javascript
<h1>🗳️ Voting System</h1>
```

To:
```javascript
<h1>🗳️ Your Tuition Center Election</h1>
```

**Update Page Title**:

**File**: `public/index.html`

Change:
```html
<title>React App</title>
```

To:
```html
<title>Class Elections</title>
```

---

## 📦 MULTIPLE CANDIDATES PER POSITION

### Add Multiple Coordinators

**File**: `src/utils/votingData.js`

Current Grade 12:
```javascript
{ id: 'coordinator', label: 'Coordinator', category: 'coordinator' }
```

With count (4 coordinators):
```javascript
{ id: 'coordinator', label: 'Coordinator', category: 'coordinator', count: 4 }
```

The system will automatically create 4 candidate slots.

---

## 🔄 FIREBASE INTEGRATION (OPTIONAL)

The app currently uses localStorage. To add Firebase:

1. **Already configured**: `src/firebase.js` has your Firebase config
2. **To enable**: Import and use Firebase methods in components
3. **Save data to Firestore** instead of localStorage

**Example** (for future implementation):
```javascript
import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

// Save vote to Firestore
await addDoc(collection(db, 'votes'), voteObject);
```

---

## 🌐 INTERNATIONALIZATION (i18n)

To support multiple languages, create language files:

**Example**: `src/i18n/en.json`
```json
{
  "home.title": "🗳️ Voting System",
  "home.student": "Student",
  "home.teacher": "Teacher",
  "home.admin": "Admin"
}
```

Then update components to use labels from the JSON file.

---

## 📝 ENVIRONMENT VARIABLES

Create `.env` file in root directory:

```env
REACT_APP_ADMIN_PIN=1234
REACT_APP_APP_NAME="Class Elections"
REACT_APP_APP_THEME=purple
```

Then use in code:
```javascript
const adminPin = process.env.REACT_APP_ADMIN_PIN;
```

---

## ✅ TESTING CONFIGURATION

### Test Data

Create test candidates:
```javascript
// In admin panel:
Grade 6 - Boy Rep: "Arvind" with symbol ⭐
Grade 6 - Girl Rep: "Priya" with symbol 🌟
Grade 12 - Overall: "Ravi" with symbol 👑
```

### Test Voting Path

1. Student vote (Grade 6)
2. Teacher vote (All grades)
3. Admin view results
4. Check localStorage for vote count

---

## 🚀 DEPLOYMENT TIPS

Before going live:

1. **Change admin PIN** to secure value
2. **Test all grades** - ensure roles are correct
3. **Add sample candidates** in admin panel
4. **Test voting flow** - student and teacher
5. **Clear old votes** - start fresh
6. **Customize colors** to match your branding

---

## 📋 CONFIGURATION CHECKLIST

- [ ] Admin PIN changed
- [ ] Colors customized
- [ ] App name updated
- [ ] Roles verified for each grade
- [ ] Sample candidates added
- [ ] Groups configured correctly
- [ ] Dashboard colors match theme
- [ ] Mobile layout tested
- [ ] Voting flow tested
- [ ] Results dashboard verified

---

**Your voting system is ready to customize! 🎉**
