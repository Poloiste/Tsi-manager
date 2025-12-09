# Responsive Testing Guide - Planning Page

## Quick Testing Instructions

### Using Browser DevTools

1. **Open the application** in Chrome, Firefox, or Safari
2. **Open DevTools** (F12 or Right-click → Inspect)
3. **Enable Device Toolbar** (Ctrl+Shift+M or Cmd+Shift+M)
4. **Test each viewport size** listed below

---

## Test Cases by Viewport Size

### 📱 Mobile Phone (<640px)
**Recommended test sizes:**
- iPhone SE: 375×667
- iPhone 12/13: 390×844
- Samsung Galaxy S20: 360×800

**What to verify:**
- ✅ Week selector buttons stack vertically
- ✅ Day cards show in 2 columns
- ✅ Schedule details stack in 1 column (day + evening)
- ✅ All buttons are at least 44×44px (easy to tap)
- ✅ Text is readable (12-16px)
- ✅ No horizontal scrolling
- ✅ Tags wrap properly without breaking
- ✅ Subject names truncate if too long

**Expected behavior:**
```
┌─────────────────┐
│  ← [Week] →     │  ← Navigation stacks
│  [Today][Add]   │  ← Buttons full width
├─────────────────┤
│ [Mon] │ [Tue]   │  ← 2 columns
│ [Wed] │ [Thu]   │
│ [Fri] │ [Sat]   │
│ [Dim] │         │
├─────────────────┤
│ Day Schedule    │  ← Single column
│ ...             │
├─────────────────┤
│ Evening Plan    │  ← Stacked below
│ ...             │
└─────────────────┘
```

---

### 📱 Small Tablet (640-767px)
**Recommended test sizes:**
- iPad Mini: 768×1024 (portrait at ~700px width)
- Kindle Fire: 600×1024

**What to verify:**
- ✅ Week selector buttons align horizontally
- ✅ Day cards show in 3 columns
- ✅ Schedule details still stack in 1 column
- ✅ Spacing increases slightly from mobile
- ✅ Text sizes increase (14-18px)

**Expected behavior:**
```
┌─────────────────────────────┐
│ ← [Week Label] → [Today][+] │  ← Horizontal layout
├─────────────────────────────┤
│ [Mon] │ [Tue] │ [Wed]       │  ← 3 columns
│ [Thu] │ [Fri] │ [Sat]       │
│ [Dim] │       │             │
├─────────────────────────────┤
│ Day Schedule                │  ← Still single column
│ ...                         │
├─────────────────────────────┤
│ Evening Plan                │
│ ...                         │
└─────────────────────────────┘
```

---

### 💻 Medium Tablet (768-1023px)
**Recommended test sizes:**
- iPad: 768×1024
- iPad Air: 820×1180

**What to verify:**
- ✅ Day cards show in 4 columns
- ✅ Schedule details still in 1 column
- ✅ More generous padding and spacing
- ✅ Text comfortable to read

**Expected behavior:**
```
┌───────────────────────────────────────┐
│ ← [Week Label] → [Today][Add Event]  │
├───────────────────────────────────────┤
│ [Mon] │ [Tue] │ [Wed] │ [Thu]        │  ← 4 columns
│ [Fri] │ [Sat] │ [Dim] │              │
├───────────────────────────────────────┤
│ Day Schedule                          │
│ ...                                   │
├───────────────────────────────────────┤
│ Evening Plan                          │
│ ...                                   │
└───────────────────────────────────────┘
```

---

### 🖥️ Desktop (≥1024px)
**Recommended test sizes:**
- MacBook: 1280×800
- Desktop HD: 1920×1080

**What to verify:**
- ✅ Day cards show in 7 columns (full week)
- ✅ Schedule details show in 2 columns side-by-side
- ✅ Optimal padding and spacing
- ✅ All text at comfortable reading size

**Expected behavior:**
```
┌───────────────────────────────────────────────────────────┐
│ ← [Week Label] → [Today][Add Event]                       │
├───────────────────────────────────────────────────────────┤
│ [Mon] │ [Tue] │ [Wed] │ [Thu] │ [Fri] │ [Sat] │ [Dim]    │  ← 7 columns
├───────────────────────────────────────────────────────────┤
│ Day Schedule          │ Evening Plan                       │  ← Side by side
│ 8h-10h Méca          │ Maths (30-60min)                  │
│ 10h-13h Elec         │ • Reprise cours                   │
│ ...                  │ • Exercices                       │
└───────────────────────────────────────────────────────────┘
```

---

## Interaction Testing

### Touch Targets (Mobile/Tablet)
Test these buttons are easy to tap (minimum 44×44px):

1. **Week Navigation**
   - [ ] Previous week button (←)
   - [ ] Next week button (→)
   - [ ] Today button
   - [ ] Add event button (+)

2. **Day Cards**
   - [ ] Each day card clickable area

3. **Schedule Items**
   - [ ] Close button (×)
   - [ ] Delete event button (🗑️)

### Text Wrapping
Verify these don't cause horizontal scroll:

1. **Event Tags**
   - [ ] "Personnalisé" tag
   - [ ] Date tag
   - [ ] Type tag (DS, DM, etc.)

2. **Schedule Details**
   - [ ] Subject names
   - [ ] Room numbers
   - [ ] Time/duration info

3. **Evening Tasks**
   - [ ] Long task descriptions
   - [ ] Subject names

---

## Common Issues to Watch For

### ❌ Problems That Should NOT Occur

1. **Layout Issues**
   - Horizontal scrolling at any viewport
   - Content overlapping
   - Text cut off or hidden
   - Cards breaking into weird columns

2. **Touch Issues**
   - Buttons too small to tap reliably
   - Accidental taps on adjacent elements
   - Unresponsive touch areas

3. **Text Issues**
   - Text too small to read (<12px)
   - Text overflowing containers
   - Words breaking mid-word inappropriately
   - Tags/badges wrapping awkwardly

### ✅ What Should Work Perfectly

1. **Smooth Transitions**
   - Resizing browser should smoothly transition layouts
   - No sudden jumps or broken layouts
   - Grid columns adjust naturally

2. **Readable Text**
   - All text readable at every viewport
   - Proper contrast and sizing
   - Smart truncation of long titles

3. **Touch-Friendly**
   - All buttons easy to tap
   - Adequate spacing between interactive elements
   - No accidental mis-taps

---

## Testing Checklist

Copy this checklist and mark items as you test:

### Mobile Phone (<640px)
- [ ] Week selector stacks vertically
- [ ] Day cards show 2 columns
- [ ] Schedule stacks (1 column)
- [ ] All buttons min 44×44px
- [ ] No horizontal scroll
- [ ] Text is readable
- [ ] Tags wrap properly

### Small Tablet (640-767px)
- [ ] Week selector horizontal
- [ ] Day cards show 3 columns
- [ ] Schedule still stacks
- [ ] Increased spacing visible
- [ ] Text sizes increased

### Medium Tablet (768-1023px)
- [ ] Day cards show 4 columns
- [ ] Schedule still stacks
- [ ] Generous padding
- [ ] Comfortable text sizes

### Desktop (≥1024px)
- [ ] Day cards show 7 columns
- [ ] Schedule shows 2 columns
- [ ] Optimal spacing
- [ ] All text comfortable

### Cross-Cutting
- [ ] No layout breaks at any size
- [ ] Smooth transitions when resizing
- [ ] Touch targets adequate
- [ ] No text overflow
- [ ] No horizontal scroll

---

## Browser Testing

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

## Device Testing (Optional)

If possible, test on real devices:
- [ ] iPhone or Android phone
- [ ] iPad or Android tablet
- [ ] Desktop monitor

---

## Reporting Issues

If you find any issues, report them with:
1. **Viewport size** (e.g., "iPhone 12, 390×844")
2. **Browser** (e.g., "Chrome 120")
3. **Screenshot** or description
4. **Specific problem** (e.g., "Add button too small to tap")
5. **Expected behavior** (e.g., "Button should be 44×44px")

---

**Status**: Ready for testing
**Last Updated**: 2025-12-09
