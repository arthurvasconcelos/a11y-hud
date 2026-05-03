export function PageA() {
  return (
    <main>
      <h1>Page A — Fixture violations</h1>
      <p>This page contains intentional accessibility violations used to test the HUD.</p>
      {/* image-alt violation: img without alt attribute */}
      <img src="https://via.placeholder.com/150" width="150" height="150" />
      {/* button-name violation: button with no accessible name */}
      <button type="button" style={{ width: 32, height: 32 }} />
    </main>
  );
}
