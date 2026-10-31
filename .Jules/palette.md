## 2024-03-08 - Accessible Icon-Only Buttons
**Learning:** Found several instances of icon-only buttons (like the Mobile Menu in PracticeUI and control buttons in LeaderElectionDemo) missing `aria-label`s, making them opaque to screen readers.
**Action:** Always verify that interactive elements lacking visible text, especially `Button` components using the `size="icon"` variant, have descriptive `aria-label`s for accessibility.
## 2024-03-08 - Accessible Icon-Only Buttons Part 2
**Learning:** Adding accessibility attributes using automated tools can easily miss cases if the regex isn't robust, but adding native `title` along with `aria-label` is crucial for sighted users interacting with icon-only buttons.
**Action:** Always ensure both `aria-label` and `title` are present for `size="icon"` Buttons, and double check all instances using python matching if regular expressions fall short.
