// Cinematic lighting for the hero taxi.
// Cool white key from the front-left, soft neutral rim from behind — reads as a real black car.
export default function TaxiLights() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 5]} intensity={1.9} color="#ffffff" />
      <pointLight position={[-3, 1.5, -3]} intensity={1.4} decay={0} color="#ffffff" />
      <pointLight position={[3, 2.6, -4.5]} intensity={1.2} decay={0} color="#d6d6da" />
      <directionalLight position={[0, 3, -6]} intensity={0.8} color="#eef2f6" />
    </>
  );
}