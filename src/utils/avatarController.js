import * as THREE from 'three';

// Reusable math objects for zero GC allocation in 60fps physics loop
const _downRay = new THREE.Raycaster();
_downRay.firstHitOnly = true;

const _sideRay = new THREE.Raycaster();
_sideRay.firstHitOnly = true;

const _boxTmp = new THREE.Box3();
const _vOrigin = new THREE.Vector3();
const _vDir = new THREE.Vector3();

/**
 * Tekstur Muka Simple Klasik Roblox R6:
 * Memberikan indikator visual yang jelas antara sisi depan (wajah senyum manis) dan sisi belakang (polos),
 * sehingga pemain langsung tahu arah hadap depan/belakang avatar secara instan.
 */
function getRobloxSimpleFaceTexture(THREE) {
  if (typeof document === 'undefined') return null;
  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 256;
  const ctx = cv.getContext('2d');

  // Latar transparan (agar warna kuning kepala asli terlihat menyatu)
  ctx.clearRect(0, 0, 256, 256);

  // Mata Kiri (hitam oval manis)
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.ellipse(82, 95, 14, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  // Mata Kanan (hitam oval manis)
  ctx.beginPath();
  ctx.ellipse(174, 95, 14, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  // Titik kilau putih di mata
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(86, 88, 5, 0, Math.PI * 2);
  ctx.arc(178, 88, 5, 0, Math.PI * 2);
  ctx.fill();

  // Senyum Klasik Roblox Lengkung Manis
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(128, 125, 52, 0.18 * Math.PI, 0.82 * Math.PI);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Avatar Humanoid Roblox R6 (Presisi Ukuran NSI Level 2 "Door"):
 * Sesuai instruksi mutlak user: "avatarnya settinggi dan selebar item NSI level 2 bernama 'Door'"
 * Dimensi NSI Door: 5.5 studs x 7.0 studs x 0.5 studs = 2.75 x 3.50 x 0.25 block
 * - Total Lebar Avatar: 2.75 block (Arm 0.6875 + Torso 1.375 + Arm 0.6875 = 2.75 block / 5.5 studs)
 * - Total Tinggi Avatar: 3.50 block (Legs 1.35 + Torso 1.35 + Head 0.80 = 3.50 block / 7.0 studs)
 * - Kaki: Tinggi 1.35 (Y = 0.0 s/d 1.35), pivot di pinggul (Y = 1.35)
 * - Torso: Tinggi 1.35 (Y = 1.35 s/d 2.70), center di Y = 2.025
 * - Lengan: Tinggi 1.35 (Y = 1.35 s/d 2.70), pivot di bahu (Y = 2.70)
 * - Kepala: Kubus 0.85 x 0.80 x 0.85 (Y = 2.70 s/d 3.50), posisi center Y = 3.10
 */
export function createHumanoidAvatar(THREE, teamColor = 0xffffff) {
  const group = new THREE.Group();
  group.name = 'PlayerAvatar';
  // Urutan rotasi YXZ: yaw (Y) dulu, baru pitch lokal (X) → kemiringan
  // tubuh saat terbang mengikuti arah HADAP avatar, bukan sumbu dunia.
  group.rotation.order = 'YXZ';

  // 1. Head (Roblox classic yellow head with face orientation indicator)
  const headMat = new THREE.MeshLambertMaterial({ color: 0xffd234 });
  const headGeo = new THREE.BoxGeometry(0.85, 0.80, 0.85);
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.set(0, 3.10, 0); // duduk pas di leher/torso Y = 2.70 s/d 3.50

  // Muka Simple Klasik Roblox (Penanda Jelas Depan & Belakang)
  const faceTex = getRobloxSimpleFaceTexture(THREE);
  if (faceTex) {
    const faceGeo = new THREE.PlaneGeometry(0.68, 0.64);
    const faceMat = new THREE.MeshBasicMaterial({
      map: faceTex,
      transparent: true,
      depthWrite: false,
    });
    const faceMesh = new THREE.Mesh(faceGeo, faceMat);
    faceMesh.position.set(0, 0, 0.85 / 2 + 0.005); // menempel tepat di sisi depan kepala (+Z)
    head.add(faceMesh);
  }

  group.add(head);

  // 2. Torso (matching active team color, lebar 1.375 x tinggi 1.35 x tebal 0.6875)
  // Sits directly on top of legs (Y = 1.35 to 2.70, center at Y = 2.025)
  const torsoMat = new THREE.MeshLambertMaterial({ color: teamColor });
  const torsoGeo = new THREE.BoxGeometry(1.375, 1.35, 0.6875);
  const torso = new THREE.Mesh(torsoGeo, torsoMat);
  torso.position.set(0, 2.025, 0);
  group.add(torso);

  // 3. Left Arm (pivot at shoulder Y = 2.70, length 1.35 down to Y = 1.35)
  const armMat = new THREE.MeshLambertMaterial({ color: 0xffd234 });
  const armGeo = new THREE.BoxGeometry(0.6875, 1.35, 0.6875);
  armGeo.translate(0, -0.675, 0); // pivot at shoulder
  const leftArm = new THREE.Mesh(armGeo, armMat);
  leftArm.position.set(-1.03125, 2.70, 0);
  group.add(leftArm);

  // 4. Right Arm (pivot at shoulder Y = 2.70)
  const rightArm = new THREE.Mesh(armGeo, armMat);
  rightArm.position.set(1.03125, 2.70, 0);
  group.add(rightArm);

  // 5. Left Leg (pivot at hip Y = 1.35, length 1.35 down to ground Y = 0.0)
  const legMat = new THREE.MeshLambertMaterial({ color: 0x1f4788 });
  const legGeo = new THREE.BoxGeometry(0.68, 1.35, 0.68);
  legGeo.translate(0, -0.675, 0); // pivot at hip
  const leftLeg = new THREE.Mesh(legGeo, legMat);
  leftLeg.position.set(-0.344, 1.35, 0);
  group.add(leftLeg);

  // 6. Right Leg (pivot at hip Y = 1.35)
  const rightLeg = new THREE.Mesh(legGeo, legMat);
  rightLeg.position.set(0.344, 1.35, 0);
  group.add(rightLeg);

  group.userData = {
    head, torso, leftArm, rightArm, leftLeg, rightLeg,
    vy: 0,
    isGrounded: true,
    walkTimer: 0,
    walkSpeed: 20,
    baseWalkSpeed: 20,      // walkSpeed bawaan (untuk Reset Admin Panel)
    baseJumpPower: 15.0,    // jumpPower bawaan (untuk Reset Admin Panel)
    flyEnabled: false,      // ADMIN PANEL: terbang bebas (superman)
  flySpeed: 36,           // ADMIN PANEL: kecepatan terbang (unit/detik)
    flySpeedMultiplier: 1.6,// pengali kecepatan terbang relatif walkSpeed
    flyBlend: 0,            // 0..1 transisi pose terbang (anti-kaku)
    infiniteJump: false,    // ADMIN PANEL: lompat tanpa batas
    jumpPower: 15.0,
    gravity: -42,
    zoomDist: 12.0, // Default distance behind avatar (Third Person)
    minZoom: 0.2,   // First-person view (inside eyes)
    maxZoom: 65.0,  // Maximum zoom out distance
    zoomSpeed: 28.0, // Units per second when holding 'i' or 'o'
    prevPos: new THREE.Vector3(),
    hasInitializedPos: false,
    wasFirstPerson: false,
  };

  return group;
}

export function updateAvatarPhysics(
  avatar, keys, dt, groundY, camera, controls, wheelDelta = 0,
  babftMap = null, blocks = [], renderer = null
) {
  if (!avatar || !avatar.userData) return;
  const u = avatar.userData;

  // Track position delta for smooth camera follow (Roblox PlayerModule follow system)
  // Anti-Teleport Bug: if avatar was teleported (spawn or team switch > 10 units), reset prevPos so camera does not shoot into void!
  if (!u.hasInitializedPos || u.prevPos.distanceTo(avatar.position) > 10.0) {
    u.prevPos.copy(avatar.position);
    u.hasInitializedPos = true;
    u.zoomDist = (typeof u.zoomDist === 'number' && u.zoomDist >= 1.2) ? u.zoomDist : 18.0;
    const initFocus = avatar.position.clone().add(new THREE.Vector3(0, 3.0, 0));
    controls.target.copy(initFocus);
    camera.position.set(avatar.position.x, avatar.position.y + 4.0, avatar.position.z - u.zoomDist);
    controls.update();
  }

  // Camera direction relative to world (horizontal plane)
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();

  const right = new THREE.Vector3();
  right.crossVectors(forward, camera.up).normalize();

  // Roblox Camera-Relative Movement
  const moveDir = new THREE.Vector3();
  if (keys.w) moveDir.add(forward);
  if (keys.s) moveDir.sub(forward);
  if (keys.d) moveDir.add(right);
  if (keys.a) moveDir.sub(right);

  const isMoving = moveDir.lengthSq() > 0.0001;
  if (isMoving && !u.flyEnabled) {
    moveDir.normalize();

    // Roblox Humanoid AutoRotate (avatar berputar luwes menghadap arah gerak)
    const targetAngle = Math.atan2(moveDir.x, moveDir.z);
    let diff = targetAngle - avatar.rotation.y;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    avatar.rotation.y += diff * Math.min(1.0, 18.0 * dt);

    // Animasi Langkah Kaki & Ayunan Tangan (R6 Walk Cycle)
    // Kaki mengayun bebas di bawah pinggul (Y <= 2.0), sama sekali tidak menabrak torso/perut!
    u.walkTimer += dt * 11;
    const swing = Math.sin(u.walkTimer) * 0.52;
    if (u.leftLeg) u.leftLeg.rotation.x = swing;
    if (u.rightLeg) u.rightLeg.rotation.x = -swing;
    if (u.leftArm) u.leftArm.rotation.x = -swing * 0.8;
    if (u.rightArm) u.rightArm.rotation.x = swing * 0.8;
  } else {
    // Idle Pose (kaki & tangan kembali tegak lurus sempurna saat diam)
    u.walkTimer = 0;
    const idleLerp = Math.min(1.0, 12.0 * dt);
    if (u.leftLeg) u.leftLeg.rotation.x = THREE.MathUtils.lerp(u.leftLeg.rotation.x, 0, idleLerp);
    if (u.rightLeg) u.rightLeg.rotation.x = THREE.MathUtils.lerp(u.rightLeg.rotation.x, 0, idleLerp);
    if (u.leftArm) u.leftArm.rotation.x = THREE.MathUtils.lerp(u.leftArm.rotation.x, 0, idleLerp);
    if (u.rightArm) u.rightArm.rotation.x = THREE.MathUtils.lerp(u.rightArm.rotation.x, 0, idleLerp);
  }

  // 1. DETEKSI TINGGI PIJAKAN TANAH / UNDAKAN / BALOK USER (Dynamic Surface Detection)
  let maxGroundY = groundY;

  // (A) Cek Kontur Tanah Map Babft via Raycast ke bawah
  if (babftMap) {
    _downRay.set(
      new THREE.Vector3(avatar.position.x, avatar.position.y + 4.0, avatar.position.z),
      new THREE.Vector3(0, -1, 0)
    );
    _downRay.far = 25.0; // jangkauan raycast ke bawah
    try {
      const terrainHits = _downRay.intersectObject(babftMap, true);
      if (terrainHits.length > 0) {
        const tHit = terrainHits[0];
        // Cek apakah permukaan horizontal atau undakan tanah yang bisa diinjak (normal Y > 0.45)
        if (tHit.face && tHit.face.normal.y > 0.45) {
          const tGroundY = tHit.point.y;
          // Avatar bisa menapak jika tanah berada di bawah kaki ATAU undakan naik kecil (step up <= 1.2 unit)
          if (tGroundY > maxGroundY && tGroundY <= avatar.position.y + 1.25) {
            maxGroundY = tGroundY;
          }
        }
      }
    } catch (_) {}
  }

  // (B) Cek Balok Buatan User (HANYA yang Collision = ON; Collision = OFF diabaikan/tembus)
  const nearbyBlocks = [];
  if (blocks && blocks.length > 0) {
    const avX = avatar.position.x;
    const avY = avatar.position.y;
    const avZ = avatar.position.z;

    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (!b || !b.position) continue;
      // Periksa properti collision: jika collision OFF (noCollision=true atau collision=false) → TEMBUS!
      if (b.userData && (b.userData.noCollision === true || b.userData.collision === false)) {
        continue; // bebas tembus tanpa halangan!
      }

      // Filter spasial cepat (radius 8 unit)
      if (Math.abs(b.position.x - avX) > 8 || Math.abs(b.position.z - avZ) > 8) continue;

      _boxTmp.setFromObject(b);
      const bMinX = _boxTmp.min.x;
      const bMaxX = _boxTmp.max.x;
      const bMinY = _boxTmp.min.y;
      const bMaxY = _boxTmp.max.y;
      const bMinZ = _boxTmp.min.z;
      const bMaxZ = _boxTmp.max.z;

      nearbyBlocks.push({ b, minX: bMinX, maxX: bMaxX, minY: bMinY, maxY: bMaxY, minZ: bMinZ, maxZ: bMaxZ });

      // Cek apakah avatar berada tepat di atas balok (horizontal footprint)
      const margin = 0.7; // radius tumpuan kaki avatar
      if (avX >= bMinX - margin && avX <= bMaxX + margin &&
          avZ >= bMinZ - margin && avZ <= bMaxZ + margin) {
        // Jika permukaan atas balok lebih tinggi dan dalam jangkauan pijakan:
        if (bMaxY > maxGroundY && bMaxY <= avY + 1.25) {
          maxGroundY = bMaxY;
        }
      }
    }
  }

  // 2. PROSES HORIZONTAL MOVEMENT + WALL / CLIFF / BLOCK COLLISION
  if (isMoving) {
    const totalStep = u.walkSpeed * dt;
    let stepX = moveDir.x * totalStep;
    let stepZ = moveDir.z * totalStep;
    const avY = avatar.position.y;

    // (A) COLLISION PADA SUMBU X
    if (Math.abs(stepX) > 0.0001) {
      const testX = avatar.position.x + stepX;
      let blockedX = false;

      // Cek balok user di sumbu X
      for (let i = 0; i < nearbyBlocks.length; i++) {
        const nb = nearbyBlocks[i];
        if (nb.maxY > avY + 0.4 && nb.minY < avY + 3.8) {
          if (testX >= nb.minX - 0.75 && testX <= nb.maxX + 0.75 &&
              avatar.position.z >= nb.minZ - 0.75 && avatar.position.z <= nb.maxZ + 0.75) {
            blockedX = true;
            break;
          }
        }
      }

      // Cek tembok / tebing map Babft di sumbu X via raycast horizontal setinggi dada (avY + 1.8)
      if (!blockedX && babftMap) {
        _vOrigin.set(avatar.position.x, avY + 1.8, avatar.position.z);
        _vDir.set(Math.sign(stepX), 0, 0);
        _sideRay.set(_vOrigin, _vDir);
        _sideRay.far = Math.abs(stepX) + 0.85;
        try {
          const sideHits = _sideRay.intersectObject(babftMap, true);
          if (sideHits.length > 0 && Math.abs(sideHits[0].face.normal.y) < 0.6) {
            blockedX = true; // terbentur dinding tebing vertikal!
          }
        } catch (_) {}
      }

      if (!blockedX) {
        avatar.position.x += stepX;
      }
    }

    // (B) COLLISION PADA SUMBU Z
    if (Math.abs(stepZ) > 0.0001) {
      const testZ = avatar.position.z + stepZ;
      let blockedZ = false;

      // Cek balok user di sumbu Z
      for (let i = 0; i < nearbyBlocks.length; i++) {
        const nb = nearbyBlocks[i];
        if (nb.maxY > avY + 0.4 && nb.minY < avY + 3.8) {
          if (testZ >= nb.minZ - 0.75 && testZ <= nb.maxZ + 0.75 &&
              avatar.position.x >= nb.minX - 0.75 && avatar.position.x <= nb.maxX + 0.75) {
            blockedZ = true;
            break;
          }
        }
      }

      // Cek tembok / tebing map Babft di sumbu Z via raycast horizontal
      if (!blockedZ && babftMap) {
        _vOrigin.set(avatar.position.x, avY + 1.8, avatar.position.z);
        _vDir.set(0, 0, Math.sign(stepZ));
        _sideRay.set(_vOrigin, _vDir);
        _sideRay.far = Math.abs(stepZ) + 0.85;
        try {
          const sideHits = _sideRay.intersectObject(babftMap, true);
          if (sideHits.length > 0 && Math.abs(sideHits[0].face.normal.y) < 0.6) {
            blockedZ = true; // terbentur dinding tebing vertikal!
          }
        } catch (_) {}
      }

      if (!blockedZ) {
        avatar.position.z += stepZ;
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ── ADMIN PANEL: FLY MODE (terbang bebas ala superman) ──
  //    Aktif hanya dari Admin Panel. Avatar bergerak ke arah pandangan kamera
  //    (maju/mundur/naik/turun) tanpa gravitasi & tanpa tabrakan, dengan
  //    animasi tubuh dimiringkan mengikuti arah terbang supaya tidak kaku.
  // ══════════════════════════════════════════════════════════════════════════
  if (u.flyEnabled) {
    // Arah pandangan kamera penuh (termasuk vertikal) — bebas terbang ke atas/bawah.
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    camDir.normalize();

    const flyDir = new THREE.Vector3();
    if (keys.w) flyDir.add(camDir);
    if (keys.s) flyDir.sub(camDir);
    if (keys.d) flyDir.add(right);
    if (keys.a) flyDir.sub(right);
    if (keys.e) flyDir.y += 1;   // E = naik
    if (keys.q) flyDir.y -= 1;   // Q = turun

    const isFlying = flyDir.lengthSq() > 0.0001;
    if (isFlying) {
      flyDir.normalize();
      // Kecepatan terbang = walkSpeed x pengali (per detik, bebas FPS)
      // Fly Speed = nilai tersendiri dari Admin Panel (bukan lagi walkSpeed x
      // pengali tetap) supaya user bisa mengatur kekencangan terbang sendiri.
      const flySpeed = (u.flySpeed && u.flySpeed > 0) ? u.flySpeed : 36;
      const step = flySpeed * dt;
      avatar.position.x += flyDir.x * step;
      avatar.position.y += flyDir.y * step;
      avatar.position.z += flyDir.z * step;

      // Hadap badan mengikuti arah terbang horizontal
      if (Math.abs(flyDir.x) > 0.0001 || Math.abs(flyDir.z) > 0.0001) {
        const targetAngle = Math.atan2(flyDir.x, flyDir.z);
        let diff = targetAngle - avatar.rotation.y;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        avatar.rotation.y += diff * Math.min(1.0, 10.0 * dt);
      }
    }

    // Pose terbang (superman): tubuh rebah menghadap arah gerak, tangan ke depan.
    // flyBlend 0..1 → transisi mulus masuk/keluar pose (tidak melompat/kaku).
    const blendTarget = isFlying ? 1 : 0.55;
    u.flyBlend += (blendTarget - u.flyBlend) * Math.min(1.0, 6.0 * dt);
    const b = u.flyBlend;

    // ── POSE SUPERMAN (FIX 2026-10-22, laporan user: "telentang kebelakang
    //    kayak orang mau tidur") ──
    // Avatar menghadap +Z lokal (sama seperti targetAngle = atan2(x, z)).
    // Rotasi X POSITIF menundukkan tubuh ke DEPAN (tengkurap, dada ke bawah,
    // kepala ke arah gerak) — seperti terbang superman. Nilai NEGATIF justru
    // membuat punggung jatuh ke belakang = telentang. Karena itu tandanya
    // dibalik di sini.
    const _pitchY = Math.asin(Math.max(-1, Math.min(1, flyDir.y)));
    const pitchTarget = isFlying ? (Math.PI * 0.46) + _pitchY * 0.45 : 0;
    avatar.rotation.x += (pitchTarget - avatar.rotation.x) * Math.min(1.0, 8.0 * dt);

    // Tangan menjulur ke depan, kaki lurus ke belakang (gaya superman)
    // Lengan menjulur ke DEPAN (searah kepala) — dengan badan tengkurap,
    // rotasi X negatif kecil membuat tangan lurus ke depan seperti superman.
    const armTarget = -Math.PI * 0.5;    // ±90° → lurus ke depan
    const legTarget = Math.PI * 0.04;    // kaki lurus sedikit ke belakang
    const poseLerp = Math.min(1.0, 8.0 * dt);
    if (u.leftArm) u.leftArm.rotation.x = THREE.MathUtils.lerp(u.leftArm.rotation.x, armTarget * b, poseLerp);
    if (u.rightArm) u.rightArm.rotation.x = THREE.MathUtils.lerp(u.rightArm.rotation.x, armTarget * b, poseLerp);
    if (u.leftLeg) u.leftLeg.rotation.x = THREE.MathUtils.lerp(u.leftLeg.rotation.x, legTarget * b, poseLerp);
    if (u.rightLeg) u.rightLeg.rotation.x = THREE.MathUtils.lerp(u.rightLeg.rotation.x, legTarget * b, poseLerp);

    // Terbang = selalu dianggap di udara (gravitasi & lompatan dimatikan)
    u.isGrounded = false;
    u.vy = 0;
    u.walkTimer = 0;
  } else if (u.flyBlend > 0.01) {
    // Baru keluar dari mode terbang: kembalikan pitch tubuh perlahan ke tegak.
    u.flyBlend += (0 - u.flyBlend) * Math.min(1.0, 8.0 * dt);
    avatar.rotation.x += (0 - avatar.rotation.x) * Math.min(1.0, 8.0 * dt);
    // Anti-jatuh-keras: begitu Fly dimatikan, jatuh dengan kecepatan wajar
    // (bukan drop mendadak dari ketinggian) supaya terasa halus & aman.
    if (u.flyBlend < 0.6) {
      u.isGrounded = false;
      if (u.vy === 0) u.vy = -2.0;
    }
  } else if (Math.abs(avatar.rotation.x) > 0.0001) {
    avatar.rotation.x = 0;
  }

  // 3. JUMP & GRAVITASI (Vertical Physics)
  if (u.flyEnabled) {
    // Terbang: input lompat diabaikan (Spasi tidak dipakai saat terbang)
    keys.space = false;
  } else if (keys.space && (u.isGrounded || u.infiniteJump)) {
    u.vy = u.jumpPower;
    u.isGrounded = false;   // infinite jump: boleh lompat lagi walau di udara
    keys.space = false; // Konsumsi input lompat
  }

  if (!u.isGrounded && !u.flyEnabled) {
    u.vy += u.gravity * dt;
    avatar.position.y += u.vy * dt;

    // R6 Air / Jump Pose
    const airLerp = Math.min(1.0, 10.0 * dt);
    if (u.leftArm) u.leftArm.rotation.x = THREE.MathUtils.lerp(u.leftArm.rotation.x, -1.2, airLerp);
    if (u.rightArm) u.rightArm.rotation.x = THREE.MathUtils.lerp(u.rightArm.rotation.x, -1.2, airLerp);
    if (u.leftLeg) u.leftLeg.rotation.x = THREE.MathUtils.lerp(u.leftLeg.rotation.x, 0.35, airLerp);
    if (u.rightLeg) u.rightLeg.rotation.x = THREE.MathUtils.lerp(u.rightLeg.rotation.x, 0.35, airLerp);

    // Mendarat di atas permukaan tanah / undakan / balok
    if (avatar.position.y <= maxGroundY) {
      avatar.position.y = maxGroundY;
      u.vy = 0;
      u.isGrounded = true;
    }
  } else {
    // Sedang menapak: cek apakah lantai turun (turun tangga/jatuh) atau naik undakan (step up)
    if (avatar.position.y < maxGroundY) {
      // Step-up naik ke undakan tanah / balok
      avatar.position.y = maxGroundY;
      u.vy = 0;
    } else if (avatar.position.y - maxGroundY > 0.45) {
      // Kaki melangkah melewati tepi tebing / balok → mulai jatuh ke bawah!
      u.isGrounded = false;
      u.vy = 0;
    } else {
      // Pijakan rata / turun landai
      avatar.position.y = maxGroundY;
      u.vy = 0;
    }
  }

  // ── ZOOM SYSTEM: Scroll Mouse + Keybinds 'I' (Zoom In) & 'O' (Zoom Out) ──
  if (wheelDelta !== 0) {
    u.zoomDist += (wheelDelta > 0 ? 3.0 : -3.0);
  }
  if (keys.i) {
    u.zoomDist -= u.zoomSpeed * dt;
  }
  if (keys.o) {
    u.zoomDist += u.zoomSpeed * dt;
  }
  u.minZoom = 0.2;
  u.zoomDist = Math.max(u.minZoom, Math.min(u.maxZoom, u.zoomDist));

  const isFirstPerson = u.zoomDist <= 1.2;

  // ── ROBLOX CAMERA SYSTEM ──
  // Translation delta avatar frame ini
  const deltaPos = new THREE.Vector3().subVectors(avatar.position, u.prevPos);
  u.prevPos.copy(avatar.position);

  if (isFirstPerson) {
    // ═════════════════════════════════════════════════════════════════════════
    // ── ROBLOX FIRST PERSON VIEW (TIDAK TERBANG, PUSAT PIVOT DI MATA AVATAR!) ──
    // ═════════════════════════════════════════════════════════════════════════
    avatar.visible = false;

    // Matikan OrbitControls selama di First Person agar OrbitControls tidak menarik posisi kamera ke langit!
    controls.enabled = false;

    // Auto-request pointer lock on canvas agar kursor terkunci di tengah
    if (renderer && renderer.domElement && typeof document !== 'undefined' && document.pointerLockElement !== renderer.domElement) {
      try { renderer.domElement.requestPointerLock(); } catch (_) {}
    }

    if (u.fpYaw === undefined) {
      u.fpYaw = Math.atan2(forward.x, forward.z);
      u.fpPitch = 0;
    }

    const yaw = u.fpYaw;
    const pitch = u.fpPitch || 0;

    // Vektor arah pandangan (look direction)
    const lookDir = new THREE.Vector3(
      Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch),
      Math.cos(yaw) * Math.cos(pitch)
    ).normalize();

    // ⚠️ PENTING: Titik pusat kamera SELALU TERKUNCI PERSIS di kepala/mata avatar (Y = 3.10)
    // Sumbu pusat rotasi berada di tubuh avatar, kamera TIDAK AKAN PERNAH terbang ke atas langit!
    const eyePos = avatar.position.clone().add(new THREE.Vector3(0, 3.10, 0));
    camera.position.copy(eyePos);

    // Bidik arah pandangan tepat 1 unit di depan mata
    const lookTarget = eyePos.clone().add(lookDir);
    camera.lookAt(lookTarget);
    controls.target.copy(lookTarget);

    // Tubuh avatar berputar mengikuti sumbu yaw pandangan horizontal
    avatar.rotation.y = yaw;
    u.wasFirstPerson = true;
  } else {
    // ═════════════════════════════════════════════════════════════════════════
    // ── ROBLOX THIRD PERSON VIEW (TITIK PUSAT KOKOH DI AVATAR — 0% MENTAL/KEGESER!) ──
    // ═════════════════════════════════════════════════════════════════════════
    // Nyalakan kembali OrbitControls untuk orbit 360° Third Person
    controls.enabled = true;

    // Lepas pointer lock agar kursor bebas kembali
    if (typeof document !== 'undefined' && document.pointerLockElement && renderer && document.pointerLockElement === renderer.domElement) {
      try { document.exitPointerLock(); } catch (_) {}
    }

    avatar.visible = true;
    u.fpYaw = undefined;
    u.fpPitch = undefined;

    // ⚠️ PENTING: Buka sudut polar hingga 172° agar BEBAS mendongak menatap langit lepas!
    controls.maxPolarAngle = Math.PI - 0.14; // bebas mendongak hingga ~166° ke langit atas!
    controls.minPolarAngle = 0.05;           // bebas menunduk melihat tanah dari atas kepala

    // Titik pusat target KOKOH dan AMAN di dada avatar (Y = 2.025) — TIDAK BOLEH KEGESER/LONCAT!
    const targetPos = avatar.position.clone().add(new THREE.Vector3(0, 2.025, 0));

    // Geser kamera bersama pergerakan avatar
    camera.position.add(deltaPos);

    if (u.wasFirstPerson) {
      u.wasFirstPerson = false;
      const backDir = forward.clone().multiplyScalar(-u.zoomDist);
      backDir.y = u.zoomDist * 0.25;
      camera.position.copy(targetPos).add(backDir);
    }

    // Hitung offset kamera terhadap target avatar
    const offset = camera.position.clone().sub(targetPos);
    if (offset.lengthSq() > 0.0001) {
      // ── ROBLOX DYNAMIC SPRING-ARM (BEBAS MENDONGAK WALAUPUN ZOOM OUT JAUH!) ──
      // Ambil arah unit bola orbit
      const dir = offset.clone().normalize();
      let actualDist = u.zoomDist;

      // Ketinggian batas tanah
      const minCamY = groundY + 0.5;
      const headHeight = targetPos.y - minCamY; // ~2.5 unit di atas batas tanah

      // Jika mendongak ke atas (dir.y < 0, kamera berada di bawah target):
      // Jarak kamera otomatis memendek mengikuti batas permukaan tanah (spring-arm occlusion),
      // SEHINGGA SUDUT DONGAK KAMERA TETAP 100% BEBAS MENATAP LANGIT TANPA KETAHAN!
      if (dir.y < -0.001) {
        const maxSafeDist = headHeight / (-dir.y);
        actualDist = Math.min(u.zoomDist, Math.max(1.8, maxSafeDist));
      }

      camera.position.copy(targetPos).add(dir.multiplyScalar(actualDist));
    }

    // Tahan kamera agar tidak amblas menembus tanah pangkalan rumput
    const minCamY = groundY + 0.5;
    if (camera.position.y < minCamY) {
      camera.position.y = minCamY;
    }

    // Titik pusat selalu 100% tepat di tubuh avatar
    controls.target.copy(targetPos);
    controls.update();
  }
}
