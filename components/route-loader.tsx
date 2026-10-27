export function RouteLoader() {
  return <main id="main" className="route-loader" role="status" aria-live="polite" aria-label="페이지를 불러오는 중">
    <div><span>BUILD TRACE</span><strong>route.resolve()</strong><i aria-hidden="true" /><strong>component.render()</strong><i aria-hidden="true" /><strong>render.ready</strong></div>
  </main>;
}
