# Broken Windows

Visible neglect makes the next compromise easier. For a coding agent, this principle protects the requested change path; it does not authorize repository-wide cleanup.

## Scope

Treat a defect as in scope when the requested change would:

- create it;
- preserve it in code being modified;
- depend on it for new behavior;
- copy or spread it elsewhere; or
- make a safe implementation impossible without repairing it.

A nearby preference, unrelated cleanup opportunity, or broad modernization is outside scope. Report a concrete follow-up instead of expanding the diff.

## Repair

1. **Name the window.** Point to repository evidence of the bad design, wrong decision, misleading code, ignored failure, or workaround.
2. **Trace the change path.** Identify the requested behavior, touched components, relevant tests, and surrounding invariants.
3. **Repair the root in scope.** Make the smallest complete correction that prevents the defect from being created, preserved, or spread.
4. **Protect the surroundings.** Preserve unrelated behavior and avoid mixing optional cleanup into the change.
5. **Report residual risk.** Describe any out-of-scope instance with its location, impact, and a bounded follow-up.

Completion means the implementation introduces no known broken window on its change path, relevant checks pass, and unresolved instances are reported without unrelated edits.
