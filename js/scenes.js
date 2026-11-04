/*
 * TOUR CONTENT - the file to edit when places, links or photos change.
 *
 * Angles are in RADIANS, exactly as the Marzipano tool exports them (yaw: 0 = centre of the
 * image, positive = right; pitch: 0 = horizon, positive = DOWN, negative = UP), so values
 * from a new Marzipano export can be pasted in as they are.
 * Open index.html?edit=1 and click the panorama to log the yaw/pitch of a spot in the console.
 *
 * Scene fields
 *   id      folder name in assets/tiles/ and file name in images/ (see tools/build_tiles.py)
 *   name / nameEn   title shown (Italian / English) on screen and on the hotspots that lead here
 *   view    opening direction
 *   links   walk-to hotspots: { to, yaw, pitch }
 *   detail  where the "detail" hotspot sits in the panorama (opens the media drawer)
 *   plan    where the camera stood on the floor plan, in metres: x from the axis of the nave (right is positive), y from the entrance towards the altar.
 *           Worked out from the hotspot bearings of the Marzipano export, so approximate.
 *   heading compass bearing of the panorama's yaw 0, in degrees (0 = towards the altar, clockwise). Keeps the view pointing the way you were
 *           walking when you move between two places.
 *   group   which list the place belongs to in the sidebar (see "groups")
 *   media   close-ups for the drawer: { label, labelEn, photo, video? } - files live in assets/media/
 *
 * The order of "scenes" is also the order of the Previous / Next buttons.
 * Link hotspots marked "added" are not in the Marzipano export (it had no way back from that panorama).
 */
window.TOUR = {
  name: "Chiesa - Spirito Santo - Botrugno (Le)",   // title, exactly as supplied by the client
  enter: "Entra dalla porta centrale",
  en: {
    enter: "Enter through the central door",
    bibliography: "Bibliography Guida di Botrugno - Vito Papa - Le guide verdi 49 - Congedo Editore"
  },
  start: "ingresso",
  bibliography: "Bibliografia Guida di Botrugno - Vito Papa - Le guide verdi 49 - Congedo Editore",   // client text, shown small at the bottom centre of the home page
  credit: { text: "©2026 domitalia360.it", url: "https://domitalia360.it" },

  // Where the central door is on assets/img/home.jpg, as a share of the photo's width and height.
  homeDoor: { x: 0.575, y: 0.72 },

  groups: [
    { id: "centro", name: "Navata e altare", nameEn: "Nave and altar" },
    { id: "destro", name: "Lato destro", nameEn: "Right side" },
    { id: "sinistro", name: "Lato sinistro", nameEn: "Left side" }
  ],

  scenes: [
    {
      id: "ingresso", name: "Ingresso", nameEn: "Entrance",
      view: { yaw: -0.0079, pitch: -0.0985 },
      group: "centro", heading: 0,
      plan: { x: 0, y: 0.3 },
      links: [
        { to: "navata", yaw: -0.0018, pitch: 0.298 },
        { to: "dx3", yaw: 1.5433, pitch: 0.1848 }
      ],
      media: []
    },
    {
      id: "navata", name: "Navata centrale", nameEn: "Central nave",
      view: { yaw: 0.1213, pitch: -0.2784 },
      group: "centro", heading: 0,
      plan: { x: 0, y: 4.3 },
      links: [
        { to: "altare", yaw: 0.0805, pitch: -0.028 },
        { to: "ingresso", yaw: -3.061, pitch: 0.3, added: true }
      ],
      detail: { yaw: 0.45, pitch: -0.85 },
      media: [
        { label: "La volta della navata", labelEn: "The nave vault", photo: "volta.jpg", video: "volta.mp4" },
        { label: "Verso l'ingresso", labelEn: "Towards the entrance", photo: "navata.jpg", video: "navata.mp4" },
        { label: "Il pulpito", labelEn: "The pulpit", photo: "pulpito.jpg" }
      ]
    },
    {
      id: "altare", name: "Altare maggiore", nameEn: "High altar",
      view: { yaw: 0.0783, pitch: -0.1946 },
      group: "centro", heading: 2,
      plan: { x: 0, y: 10.2 },
      links: [
        { to: "dx1", yaw: 1.6635, pitch: 0.2023 },
        { to: "navata", yaw: -3.089, pitch: 0.2907 },
        { to: "sx1", yaw: -1.6475, pitch: 0.2165 }
      ],
      detail: { yaw: 0.08, pitch: -0.1 },
      media: [
        { label: "L'altare maggiore", labelEn: "The high altar", photo: "altare.jpg", video: "altare.mp4" },
        { label: "L'altare visto dall'angolo", labelEn: "The altar seen from the corner", photo: "altare-angolo.jpg" }
      ]
    },
    {
      id: "dx1", name: "Transetto destro 1", nameEn: "Right transept 1",
      view: { yaw: -1.0046, pitch: 0.0346 },
      group: "destro", heading: 15,
      plan: { x: 4.9, y: 8.9 },
      links: [
        { to: "altare", yaw: -1.7065, pitch: 0.243 },
        { to: "dx2", yaw: -3.1393, pitch: 0.2648 }
      ],
      detail: { yaw: -1.0, pitch: -0.05 },
      media: [
        { label: "Altare", labelEn: "Altar", photo: "dx1a.jpg", video: "dx1a.mp4" },
        { label: "Teca a vetri", labelEn: "Glass display case", photo: "dx1-teca.jpg" },
        { label: "Secondo altare", labelEn: "Second altar", photo: "dx1b.jpg", video: "dx1b.mp4" }
      ]
    },
    {
      id: "dx2", name: "Transetto destro 2", nameEn: "Right transept 2",
      view: { yaw: -0.6797, pitch: 0.0133 },
      group: "destro", heading: 0,
      plan: { x: 4.9, y: 4.2 },
      links: [
        { to: "navata", yaw: -1.5594, pitch: 0.2326 },
        { to: "dx1", yaw: 0.009, pitch: 0.1773 }
      ],
      detail: { yaw: -0.68, pitch: -0.05 },
      media: [{ label: "Altare", labelEn: "Altar", photo: "dx2.jpg", video: "dx2.mp4" }]
    },
    {
      id: "dx3", name: "Transetto destro 3", nameEn: "Right transept 3",
      view: { yaw: -0.7377, pitch: -0.0329 },
      group: "destro", heading: 0,
      plan: { x: 4.9, y: 0.7 },
      links: [
        { to: "dx2", yaw: 0.077, pitch: 0.3824 }
      ],
      detail: { yaw: -0.74, pitch: -0.1 },
      media: [{ label: "Altare", labelEn: "Altar", photo: "dx3.jpg", video: "dx3.mp4" }]
    },
    {
      id: "sx3", name: "Transetto sinistro 3", nameEn: "Left transept 3",
      view: { yaw: 0.5999, pitch: 0.0358 },
      group: "sinistro", heading: 0,
      plan: { x: -4.9, y: 0.7 },
      links: [
        { to: "sx2", yaw: -0.1351, pitch: 0.298 },
        { to: "ingresso", yaw: 1.942, pitch: 0.2355 }
      ],
      detail: { yaw: 0.6, pitch: -0.05 },
      media: [{ label: "Altare", labelEn: "Altar", photo: "sx3.jpg", video: "sx3.mp4" }]
    },
    {
      id: "sx2", name: "Transetto sinistro 2", nameEn: "Left transept 2",
      view: { yaw: 0.7189, pitch: 0.0385 },
      group: "sinistro", heading: -18,
      plan: { x: -4.9, y: 4.4 },
      links: [
        { to: "sx1", yaw: 0.0574, pitch: 0.2638 },
        { to: "navata", yaw: 2.0139, pitch: 0.225 },
        { to: "sx3", yaw: -2.969, pitch: 0.2197 }
      ],
      detail: { yaw: 0.72, pitch: -0.05 },
      media: [{ label: "Altare", labelEn: "Altar", photo: "sx2.jpg", video: "sx2.mp4" }]
    },
    {
      id: "sx1", name: "Transetto sinistro 1", nameEn: "Left transept 1",
      view: { yaw: -0.9408, pitch: -0.0535 },
      group: "sinistro", heading: 163,
      plan: { x: -4.9, y: 8.5 },
      links: [
        { to: "navata", yaw: -1.0683, pitch: 0.2641 },
        { to: "sx2", yaw: 0.0379, pitch: 0.2162 }
      ],
      detail: { yaw: -0.94, pitch: -0.2 },
      media: [
        { label: "Altare", labelEn: "Altar", photo: "sx1a.jpg", video: "sx1a.mp4" },
        { label: "Secondo altare", labelEn: "Second altar", photo: "sx1b.jpg", video: "sx1b.mp4" }
      ]
    }
  ]
};
