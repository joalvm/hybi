const BG_URL = new URL('../../../../resources/images/space-bg.svg', import.meta.url).href;

/** Brand journey stays decorative: it names the direction and carries no state. */
export function WelcomeFlight() {
  return (
    <figure className="welcome-flight" aria-label="Hybi viajando hacia la izquierda">
      <div className="welcome-flight__scene" aria-hidden="true">
        <img src={BG_URL} alt="" className="welcome-flight__bg" />
      </div>
    </figure>
  );
}
