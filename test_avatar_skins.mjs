/* Unit test bab 213 — 8 skin default + dukungan preset createHumanoidAvatar.
   Jalankan: node test_avatar_skins.mjs */
import * as THREE from 'three';
import { AVATAR_SKINS, createHumanoidAvatar } from './src/utils/avatarController.js';

let pass = 0, fail = 0;
const check = (c, m) => { console.log((c ? '  PASS  ' : '  FAIL  ') + m); c ? pass++ : fail++; };

check(Array.isArray(AVATAR_SKINS) && AVATAR_SKINS.length === 8,
  `AVATAR_SKINS = 8 preset (terukur ${AVATAR_SKINS.length})`);
const hexOk = (h) => /^#[0-9a-fA-F]{6}$/.test(h);
let allValid = true;
for (const sk of AVATAR_SKINS) {
  if (!sk.key || !sk.name || !hexOk(sk.head) || !hexOk(sk.torso) || !hexOk(sk.arms) || !hexOk(sk.legs)) allValid = false;
}
check(allValid, 'semua preset punya key/name + 4 warna hex valid');
check(new Set(AVATAR_SKINS.map(s => s.key)).size === 8, 'key unik semua');

// default (tanpa preset): warna bawaan
const a1 = createHumanoidAvatar(THREE, 0x1f4788);
check(a1.userData.head.material.color.getHexString() === 'ffd234', 'tanpa preset: kepala kuning bawaan');
check(a1.userData.torso.material.color.getHexString() === '1f4788', 'tanpa preset: torso = warna tim');

// preset: warna diambil dari skin
const sk = AVATAR_SKINS[5]; // Emas Murni
const a2 = createHumanoidAvatar(THREE, 0x1f4788, sk);
check(a2.userData.torso.material.color.getHexString() === 'eab308',
  `preset Emas: torso = ${sk.torso.slice(1)} (terukur ${a2.userData.torso.material.color.getHexString()})`);
check(a2.userData.head.material.color.getHexString() === sk.head.slice(1).toLowerCase(),
  'preset Emas: kepala sesuai skin');
check(a2.userData.leftLeg.material.color.getHexString() === sk.legs.slice(1).toLowerCase(),
  'preset Emas: kaki sesuai skin');
// lengan kiri & kanan SHARE material (hemat) — keduanya ikut skin
check(a2.userData.leftArm.material === a2.userData.rightArm.material, 'lengan L/R share material');
check(a2.userData.leftArm.material.color.getHexString() === sk.arms.slice(1).toLowerCase(), 'preset Emas: lengan sesuai skin');
// scale bab 212 tetap
check(Math.abs(a2.scale.x - 0.85) < 1e-9, 'scale avatar tetap 0.85');

console.log(`\nAVATAR SKINS TEST: ${pass} PASS / ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
