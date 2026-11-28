// Осанка 3D-героев: после анимации снимает лишний наклон вперёд (клипы из разных источников сутулят персонажей,
// у Смотрителя спина в позе покоя согнута). Меряем линию «таз → голова» в плоскости «вперёд-вверх» персонажа:
// если она наклонена вперёд сильнее нормы, доворачиваем позвонки назад (поровну на каждый), боковой наклон и
// повороты остаются. Так же шея: голова не выезжает вперёд «как у Добби». Подключается и в игре (THREE r128),
// и в прологе (cs/index.html, свой THREE): window.makePosture(THREE) → upright(B, root, {lean, neck}).
// ?noposture — выключить для сравнения.
window.makePosture = function (T) {
  let ps = ''; try { ps = parent.location.search; } catch (e) { }
  const off = /[?&]noposture/.test(location.search + ps);
  const t2 = new T.Vector3(), a = new T.Vector3(), b = new T.Vector3(), v = new T.Vector3(), d = new T.Vector3();
  const up = new T.Vector3(), f = new T.Vector3(), s = new T.Vector3();
  const qr = new T.Quaternion(), qp = new T.Quaternion(), qL = new T.Quaternion(), qI = new T.Quaternion(), qw = new T.Quaternion();
  // повернуть кость на мировой поворот R (с сохранением её локальной анимации)
  function rotWorld(bone, R) {
    bone.parent.getWorldQuaternion(qp);
    qL.copy(qp).invert().multiply(R).multiply(qp);
    bone.quaternion.premultiply(qL);
    bone.updateMatrixWorld(true);
  }
  function fix(chain, base, top, maxLean, minLean) {
    const n = chain.length;
    for (let i = 0; i < n; i++) {
      base.getWorldPosition(a); top.getWorldPosition(b); v.subVectors(b, a);
      const vu = v.dot(up), vf = v.dot(f), vs = v.dot(s);
      if (vu <= 1e-4) return;
      const hi = vu * Math.tan(maxLean), lo = vu * Math.tan(minLean == null ? -1.5 : minLean);
      if (vf <= hi + 1e-4 && vf >= lo - 1e-4) return;    // наклон в норме — не трогаем
      const lim = vf > hi ? hi : lo;                     // слишком вперёд — к верхней границе, «выгнулся» назад — к нижней
      d.copy(s).multiplyScalar(vs).addScaledVector(f, lim).addScaledVector(up, vu).normalize();
      qr.setFromUnitVectors(v.normalize(), d);
      qI.set(0, 0, 0, 1).slerp(qr, 1 / (n - i));        // доля поворота на этот позвонок
      rotWorld(chain[i], qI);
    }
  }
  return function upright(B, root, o) {
    if (off || !B || !root) return;
    o = o || {};
    root.updateMatrixWorld(true);
    root.getWorldQuaternion(qw);
    up.set(0, 1, 0).applyQuaternion(qw); f.set(0, 0, 1).applyQuaternion(qw);
    // «вперёд» — куда смотрят носки (у части моделей ось Z узла смотрит назад); без стоп — ось узла
    const toes = [['LeftFoot', 'LeftToeBase'], ['RightFoot', 'RightToeBase']].filter(p => B[p[0]] && B[p[1]]);
    if (toes.length) {
      d.set(0, 0, 0);
      for (const [p0, p1] of toes) { B[p0].getWorldPosition(a); B[p1].getWorldPosition(b); d.add(b.sub(a)); }
      d.addScaledVector(up, -d.dot(up));
      if (d.lengthSq() > 1e-8) f.copy(d.normalize());
    }
    s.crossVectors(up, f);
    const spine = [B.Spine, B.Spine1, B.Spine2].filter(Boolean);
    // спина: от «таз вперёд, плечи назад» (−3°) до лёгкого наклона (+5°; на ходу и сидя — больше)
    if (B.Hips && (B.Neck || B.Head) && spine.length) fix(spine, B.Hips, B.Neck || B.Head, o.lean == null ? .09 : o.lean, o.back == null ? -.05 : o.back);
    if (B.Neck && B.Head && o.neck !== false) {
      // шея: голова не дальше ~14° вперёд (было до 27° — «Добби»)
      fix([B.Neck], B.Neck, B.Head, o.neck == null ? .24 : o.neck, -.05);
    }
  };
};
if (window.THREE && THREE.Vector3) window.UPRIGHT = window.makePosture(THREE);
