export function PageB() {
  return (
    <main>
      <h1>Page B — Form violations</h1>
      <p>This page contains form inputs without labels — intentional violations for testing.</p>
      <form>
        {/* label violations: inputs with no associated label element */}
        <input type="text" name="name" placeholder="Name" />
        <input type="email" name="email" placeholder="Email" />
        <button type="submit">Submit</button>
      </form>
    </main>
  );
}
