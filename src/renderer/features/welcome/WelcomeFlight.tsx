const BG_URL = new URL('../../../../resources/images/space-bg.svg', import.meta.url).href;

/** Brand journey stays decorative: it names the direction and carries no state. */
export function WelcomeFlight() {
  return (
    <figure
      className="welcome-flight relative h-full min-w-0 self-stretch overflow-hidden"
      aria-label="Hybi viajando hacia la izquierda"
    >
      <div className="welcome-flight-scene absolute inset-0" aria-hidden="true">
        <img src={BG_URL} alt="" className="absolute right-0 bottom-0 max-h-full max-w-full" />
      </div>
    </figure>
  );
}
