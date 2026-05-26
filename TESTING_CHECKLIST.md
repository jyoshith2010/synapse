# Synapse Testing Checklist

## User Flows to Test End-to-End

### 1. Authentication Flow
- [ ] Landing page loads correctly
- [ ] "Get Started Free" button navigates to onboarding
- [ ] Onboarding form submission creates user
- [ ] Login with correct credentials works
- [ ] Login with incorrect credentials shows error
- [ ] Logout functionality works
- [ ] Admin access from landing footer works
- [ ] Admin login with correct ID/passcode (admin/synapse2024)
- [ ] Admin login with incorrect credentials shows error

### 2. Dashboard Flow
- [ ] Dashboard loads with user data
- [ ] Greeting displays correctly based on time of day
- [ ] Stats display correctly (streak, study time, accuracy)
- [ ] Widget customization modal opens
- [ ] Widget toggles work (show/hide widgets)
- [ ] Background image upload works
- [ ] Background image removal works
- [ ] Accent color selection works
- [ ] Widget opacity slider works
- [ ] Study time logging modal opens
- [ ] Study time logging saves correctly
- [ ] Study time displays in stats

### 3. Study Planner Flow
- [ ] Planner loads with tasks
- [ ] Add new task works
- [ ] Edit existing task works
- [ ] Delete task works
- [ ] Mark task as complete works
- [ ] Task filtering by date works
- [ ] Task persistence across reloads

### 4. Notes Flow
- [ ] Notes page loads with notes list
- [ ] Create new note works
- [ ] Scan image for text works
- [ ] OCR processing completes
- [ ] AI summarization works
- [ ] AI flashcard generation works
- [ ] Edit note works
- [ ] Delete note works
- [ ] Mark note as favorite works
- [ ] Folder filtering works (All, Favorites, Recent)
- [ ] Search functionality works
- [ ] Tag filtering works
- [ ] Note persistence across reloads
- [ ] Subject selection includes all commerce subjects (Accountancy, Business Studies, Economics, Statistics, Computer Science)

### 5. Flashcards Flow
- [ ] Flashcards page loads with cards
- [ ] Create new flashcard works
- [ ] Flip card works
- [ ] Mark as easy/hard works
- [ ] Spaced repetition algorithm works
- [ ] Delete flashcard works
- [ ] Filter by subject works
- [ ] Card persistence across reloads

### 6. Mock Tests Flow
- [ ] Mock tests page loads with test list
- [ ] Select test works
- [ ] Start test works
- [ ] Answer questions works
- [ ] Timer countdown works
- [ ] Submit test works
- [ ] Results display correctly
- [ ] AI explanation generation works
- [ ] Speed grading displays
- [ ] Difficulty selection works
- [ ] Time-bound exam mode works
- [ ] Answer key upload (admin) works
- [ ] Test upload (admin) works
- [ ] AI test generation works
- [ ] Test persistence across reloads

### 7. Study Timer Flow
- [ ] Timer page loads
- [ ] Start timer works
- [ ] Pause timer works
- [ ] Stop timer works
- [ ] Custom timing (any hours) works
- [ ] Subject selection works
- [ ] Timer displays correctly
- [ ] Session saves to history

### 8. Analytics Flow
- [ ] Analytics page loads
- [ ] Study time charts display
- [ ] Subject breakdown displays
- [ ] Progress tracking displays
- [ ] Accuracy metrics display

### 9. Exam Tracker Flow
- [ ] Exam tracker page loads
- [ ] Add new exam works
- [ ] Delete exam works
- [ ] Select exam shows syllabus
- [ ] Toggle syllabus topic completion works
- [ ] Add custom syllabus topic works
- [ ] Delete syllabus topic works
- [ ] OCR scan index works
- [ ] Subject selection includes all commerce subjects
- [ ] Weak topic tracking works
- [ ] Exam persistence across reloads

### 10. AI Assistant Flow
- [ ] AI assistant page loads
- [ ] Send message works
- [ ] AI response displays
- [ ] Quick action buttons work
- [ ] Image upload works
- [ ] Flashcard generation works
- [ ] Summary generation works
- [ ] Subject selection includes all commerce subjects

### 11. Groups Flow
- [ ] Groups page loads
- [ ] Create group works
- [ ] Join group with code works
- [ ] Group list displays
- [ ] Group persistence across reloads

### 12. Settings Flow
- [ ] Settings page loads
- [ ] Profile update works
- [ ] Theme customization works
- [ ] Background image upload works
- [ ] Accent color selection works
- [ ] Font size selection works
- [ ] Border radius selection works
- [ ] Glass effect intensity works
- [ ] Settings persistence across reloads

### 13. Admin Panel Flow
- [ ] Admin login works (admin/synapse2024)
- [ ] Mock Tests tab loads
- [ ] Upload mock test (JSON) works
- [ ] Upload answer key (JSON) works
- [ ] Delete mock test works
- [ ] Syllabus tab loads
- [ ] Subject selection includes all commerce subjects
- [ ] Add syllabus topic works
- [ ] Delete syllabus topic works
- [ ] Toggle topic completion works
- [ ] Admin data persistence across reloads
- [ ] Back to landing page works

### 14. Navigation Flow
- [ ] Sidebar navigation works
- [ ] Page transitions are smooth
- [ ] Mobile menu toggle works
- [ ] Mobile menu closes on overlay click
- [ ] Active page highlighting works

### 15. Data Persistence
- [ ] All data persists across page reloads
- [ ] All data persists across browser sessions
- [ ] localStorage works correctly
- [ ] No data loss on logout/login

### 16. Responsive Design
- [ ] Desktop layout works correctly
- [ ] Tablet layout works correctly
- [ ] Mobile layout works correctly
- [ ] Mobile menu works
- [ ] Touch targets are appropriate size

### 17. Performance
- [ ] Page load times are acceptable
- [ ] Lazy loading works for Dashboard, AI, AIHub, Notes
- [ ] Loading screen displays correctly
- [ ] No memory leaks
- [ ] Smooth animations

### 18. Edge Cases
- [ ] Empty states display correctly
- [ ] Error messages display appropriately
- [ ] Network errors handled gracefully
- [ ] Invalid inputs are rejected
- [ ] Large file uploads handled
- [ ] Concurrent operations don't cause conflicts

## Browser Compatibility
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browsers

## Commerce Subjects Verification
- [ ] Accountancy appears in all subject selectors
- [ ] Business Studies appears in all subject selectors
- [ ] Economics appears in all subject selectors
- [ ] Statistics appears in all subject selectors
- [ ] Computer Science appears in all subject selectors
- [ ] Color schemes are consistent for commerce subjects
- [ ] Default syllabi load correctly for commerce subjects

## Known Issues
- (Document any issues found during testing)

## Test Results
- Date: ___________
- Tester: ___________
- Overall Status: [ ] Pass [ ] Fail
- Notes: ___________
