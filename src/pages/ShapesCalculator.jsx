import { useState } from 'react';
import {
    ArrowLeft, Calculator, ChevronDown, Circle, Cone, Donut, Globe,
    Terminal, Youtube,
} from 'lucide-react';

/* ======================================================================
   SHAPES CALCULATOR — halaman React Orang Jawa.

   Porting dari kalkulator standalone v1.2.1 (vanilla HTML/JS, by
   @dabl2829 di YouTube) ke page ini. Task: GANTI DESIGN saja — fungsi,
   rumus, perhitungan, format output & pesan error TIDAK DIUBAH SAMA
   SEKALI (lihat memory.md Bagian 63 & design.md Bagian 40).

   ATURAN PORTING (WAJIB DIBACA SEBELUM MENGEDIT FUNGSI DI BAWAH):
   1. Blok script original (komentar versi s.d. fungsi torus) di-copy
      PERSIS karakter-per-karakter — indentasi 4 spasi aslinya sengaja
      dipertahankan supaya bisa diverifikasi diff terhadap original.
      DILARANG mengubah rumus/perhitungan/output di blok itu.
   2. Yang baru HANYA lapisan presentasi: layout, styling, dan cara
      event di-wire (React onClick/onChange menggantikan assignment
      .onclick/.onchange yang tadinya di akhir script original).
   3. Adaptasi struktur TANPA mengubah perilaku:
      a. ID elemen spacer <br> (circle1/2/4/6, sphere1/2/4/6,
         cone1/2/4/6/8/10/12, torus1/2/4/6/8/10) tidak diperlukan lagi
         (spacing via CSS flex-gap) -> ID spacer dikeluarkan dari list
         display(). Elemen konten & perilaku show/hide tiap mode PERSIS
         sama dengan original.
      b. Baris `input('cone8').style.display=...` pada handler onchange
         cone-type dihapus — cone8 spacer <br> (bukan konten).
      c. STRICT-MODE SHIM: script original jalan di <script> sloppy-mode
         (assignment tanpa deklarasi otomatis jadi global). ES module
         SELALU strict mode -> ditambahkan blok `var` di bawah supaya
         tubuh fungsi original tidak perlu diubah satu karakter pun.
   4. FIX VISIBILITY CONE (disetujui user eksplisit — lihat memory.md
      Bagian 64): script original punya kejanggalan KE BALIK — handler
      onchange men-toggle cone7 ("Bottom diameter") padahal komentar HTML
      original bilang "top diameter option only shows up if broken is
      true" (maksud author: cone9 yang di-toggle), dan list lcone
      memasukkan cone9 tapi TIDAK cone7. Fix di lapisan presentasi SAJA:
      - cone7 ("Bottom diameter") masuk lcone -> selalu tampil di mode
        Cone (dibutuhkan semua perhitungan cone, full maupun broken).
      - cone9 ("Top diameter") keluar dari lcone -> hanya tampil saat
        "Cone type" = Broken (toggle onChange + sinkronisasi saat ganti
        mode).
      Fungsi hitung cone() TIDAK diubah — dia tetap membaca value input
      apa pun visibility-nya (utk type Full, top_d tetap di-nol-kan oleh
      kode original).
   ====================================================================== */

/* ── STRICT-MODE SHIM ────────────────────────────────────────────────
   Deklarasi SEMUA variabel implicit-global dari script original
   (+ list lcircle/lsphere/lcone/ltorus). Tanpa blok ini, tubuh fungsi
   original (yang tidak boleh diubah) akan throw ReferenceError di
   strict mode ES module. */
var decimals, p, product, i, n, parts, factors, str, smaller, a, d, deg, pi,
    circle_piece, valid, time, out, tn, td, nicenumber, pt, gl, gh, grid,
    blocks, one, type, height, bottom_d, top_d, circle_bottom, circle_top,
    tilt_angle, shape_height, alpha, side, tri_base, trap_top, trap_bottom,
    outer_d, inner_d, dd, radius, cross, q, qd, base_CP, gap_fix, position,
    length, AIS, lcircle, lsphere, lcone, ltorus;

//shapes calculator (by @dabl2928 on youtube)
    //started (2026 Apr 28)
    //v1.0.0 - initial release (2026 Jun 4)
    //v1.1.0 - added prime factorisation for degrees to save time when cloning and rotating (2026 Aug 1)
    //v1.1.1 - added circle tutorial link (2026 Aug 4)
    //v1.2.0 - updated to 3 decimals and added sphere tutorial link (2026 Aug 8)
    //v1.2.1 - fixed a cone bug (2026 Aug 8)

    decimals=3 //number of decimals to round to

    function round(n,d=decimals) {
      p=Math.pow(10,d)
      return Math.round(n*p)/p //default rounds to 3 decimals
    }

    function input(id) {
      return document.getElementById(id)
    }

    function isNearlyInteger(x,e=1e-9) {
      return Math.abs(Math.round(x)-x)<e //allows numbers like 2.000000000004 or 1.999999999999998 or whatever (computer math bug because its binary)
    }

    function primefactorisation(n) {const factors=[];if (!Number.isInteger(n)||n<2) {return factors}
      while (n%2===0) {factors.push(2);n /= 2};let divisor = 3
      while (divisor * divisor <= n) {while (n % divisor === 0) {factors.push(divisor);n/=divisor} divisor+=2}
      if (n>1){factors.push(n)};return factors} //returns a list of prime factors of the number inputted

    function arraymult(arr,n){
      product=1
      for (i=0;i<=n && i<arr.length;i++){
        product*=arr[i]
      }
      return product
    }

    function complete(deg) {
      if (isNearlyInteger(360/deg)) {
        parts=round(360/deg)
        factors=primefactorisation(parts)
        str=``
        for (n=0;n<factors.length;n++) {
          if (n==0) {str+=`\n\n\nOptional shortcut for ${deg} degree rotating and cloning:\n`}
          smaller=arraymult(factors,n)
          if (360/smaller!=180) {str+=` -rotate and clone by ${360/smaller} for ${factors[n]-1} time(s)\n`}
        }
        return str
      } else {
        return ``
      }
    }

    function display(list,onoff) {
      for (let id of list) {
        input(id).style.display=onoff
      }
    }

    //grouped inputs lists
    //CATATAN PORTING: list disesuaikan ke struktur DOM baru — ID spacer <br>
    //(circle1/2/4/6, dst.) tidak diperlukan lagi karena spacing layout baru
    //memakai CSS flex-gap. Elemen konten & perilaku show/hide tiap mode
    //PERSIS sama dengan original (verifikasi: memory.md Bagian 63).
    //FIX VISIBILITY CONE (disetujui user — memory.md Bagian 64): cone7
    //(Bottom diameter) dimasukkan & cone9 (Top diameter) dikeluarkan,
    //sesuai intent komentar HTML original ("top diameter option only
    //shows up if broken is true"). Fungsi hitung tidak terpengaruh.
    lcircle=['circle0','circle3','circle5','calc_circle']
    lsphere=['sphere0','sphere3','sphere5','calc_sphere']
    lcone=['cone0','cone3','cone5','cone7','cone11','calc_cone']
    ltorus=['torus0','torus3','torus5','torus7','torus9','calc_torus']

function circleinputs () {
      display(lcircle,'')
      display(lsphere,'none')
      display(lcone,'none')
      display(ltorus,'none')
      ASCIIcircle()
    }

    function sphereinputs () {
      display(lcircle,'none')
      display(lsphere,'')
      display(lcone,'none')
      display(ltorus,'none')
      ASCIIsphere()
    }

    function coneinputs () {
      display(lcircle,'none')
      display(lsphere,'none')
      display(lcone,'')
      display(ltorus,'none')
      ASCIIfullcone()
    }

    function torusinputs () {
      display(lcircle,'none')
      display(lsphere,'none')
      display(lcone,'none')
      display(ltorus,'')
      ASCIItorus()
    }


    
function ASCIIcircle() {
      a='\n'
      a+='                   ....\n'
      a+='           .~:++==oooooo==++:~~\n'
      a+='       .~+=ooooooooooooooooooo==+:.\n'
      a+='     ~+oooooooooooooooooooooooooooo+~.\n'
      a+='   ~+o=oooooooooooooooooooooooooooooo=~\n'
      a+='  :=ooooooooooooooooooooooooooooooooooo+\n'
      a+=' :oooooooooooooooooooooooooooooooooooooo+\n'
      a+='~oooooooooooooooooooooooooooooooooooooooo:\n'
      a+='+ooooooooooooooooooooooooooooooooooooooooo\n'
      a+='+=oooooooooooooooooooooooooooooooooooooooo.\n'
      a+=':oooooooooooooooooooooooooooooooooooooooo+\n'
      a+='.=ooooooooooooooooooooooooooooooooooooooo~\n'
      a+=' ~oooooooooooooooooooooooooooooooooooooo:\n'
      a+='  .+oooooooooooooooooooooooooooooooooo=~\n'
      a+='    ~=oooooooooooooooooooooooooooooo=:\n'
      a+='      ~:=o=oooooooooooooo=oooooooo+~.\n'
      a+='         ~:+=oooooooooooo=ooo=+:~.\n'
      a+='             .~~:::++:+:::~~..\n'
      input('output').textContent=a
      input('output').style.fontSize='11px'
      input('output').style.fontWeight='bold'
    }

    function ASCIIsphere() {
      a='\n'
      a+='                         MMM$$@@@####%#%%#%####@$$MM                          \n'
      a+='                      $$@####%#%%%%%%%%%%%%%%%%%%%%%#@$$                      \n'
      a+='                  M$@#####%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@$M                  \n'
      a+='               M$@####%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%#$M               \n'
      a+='             $@#####%#%%%%%%%%%%%%%%%%^%%%%%%%%%%%%%%%%%%%%%%%#@$             \n'
      a+='           $@@####%%%%%%%%%%%%%%%^^%%%%^^%^%%^%^%%%^%%%%%%%%%%%%%@$           \n'
      a+='         M@@####%%%%%%%%%%%%%%%%^%%^^^^^^^^^^^^^^^^%%%^%%%%%%%%%%%%#$         \n'
      a+='        $#####%%%%%%%%%%%%%%%%^%^^^%^^^^^^^^^^^^^^^^^^%^%^%%%%%%%%%%#$M       \n'
      a+='      M@@###%#%%%%%%%%%%%%%%%^^^^%^^^^^^^^^^^^^^^^^^^^^^^%^^%%%%%%%%%%#M      \n'
      a+='     $@@#####%%%%%%%%%%%%^^%%^^^^^^^^^^^^^^^^^^^^^^^^^^^^^%^%%^%%%%%%%%#$     \n'
      a+='    M@@@###%%%%%%%%%%%%%%%%^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^%%%%%%%%%%##$    \n'
      a+='   M@@####%%%%%%%%%%%%%%^%%^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^%%%%%%%%%%#M   \n'
      a+='  M@@###%#%#%%%%%%%%%%%^%^^%^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^%%^^%%%%%%%%%##M  \n'
      a+='  $@@@###%%#%%%%%%%%%%%%%^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^%%%%%%%%%%##@  \n'
      a+=' M@@####%#%%%%%%%%%%%%^%^%%^%^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^%^%%%%%%%%%##M \n'
      a+=' $$@@##%#%%%%%%%%%%%%%%%%^%^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^%%^^%^%%%%%%%%%#$ \n'
      a+='M$@@@#####%#%%%%%%%%%%^%^%^%^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^%%%%%%%%%%%### \n'
      a+='M$@@#####%#%%%%%%%%%%%%%%%^%%^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^%^%%%%%%%%%%###M\n'
      a+='$$@@@###%#%%#%%%%%%%%%%%%^%^^^^^%^^^^^^^^^^^^^^^^^^^^^^^^^^%%^%%%%%%%%%%%%###M\n'
      a+='M$$@@####%#%%%%%%%%%%%%%%%%%^%%^^^^^^^^^^^^^^^^^^^^^^^^^^%^^%^%%%%%%%%%%%%%##M\n'
      a+='M$@@@@@####%#%%%%%%%%%%%%%%^%%^^^%^^^^^^^^^^^^^^^^^^^^%^^^%^%%%%%%%%%%%%####@ \n'
      a+=' $$@@@@#####%%%%%%%%%%%%%%%%%%%%^^%^^^^^^^^^^^^^^^^%^%^^%^^%%%%%%%%%%%%%%###@ \n'
      a+=' M$$@@@########%%%%%%%%%%%%%%%%^%%%^^%^%^^%^%^%^^^%^^%%%%%%%%%%%%%%%%%#%###@M \n'
      a+=' M$$$@@@@#####%%%%%%%%%%%%%%%%%%%%%%%^%%^%%^%^^%^%%^%%%%%%%%%%%%%%%%%%%###@$  \n'
      a+='  M$$@@@@####%###%#%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%####@@$  \n'
      a+='   M$$$@@@#@@####%%#%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%####@@$   \n'
      a+='    M$$$$@@########%#%#%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%#%#####@@$    \n'
      a+='    MM$$$@@@@@#######%#%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%######@@@$     \n'
      a+='      MM$$$@@@@@@######%###%#%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%###%#####@@@M      \n'
      a+='       MM$$$$$@@@@@########%#%#%#%%%%%%%%%%%%%%%%%%%%%%%#%%#####@#@@@$M       \n'
      a+='         MMM$$$@@@@@@@###########%###%%%%##%%%#%%#%############@@@@$M         \n'
      a+='           MMM$$$@$@@@@@@@#################%###############@@@@@$$$           \n'
      a+='            M MMM$$$$$@@@@@@#@@#######################@#@@#@@@$$MM            \n'
      a+='                MMM$$$$$$@$@@@@@@@#@#@@#@#@#@###@@@@@@@@@@$$$MM               \n'
      a+='                    MMM$$$$$$@$@@@@@@@@@@@@#@@@@@@@@@$$$$$MM                  \n'
      a+='                         MMMM$$$$$$$$$$@$@$$$@$$$$$$$MMM                      \n'
      a+='                                MMMMMMM$MM$MMMMMM                             \n'
      input('output').textContent=a
      input('output').style.fontSize='6px'
      input('output').style.fontWeight='bold'
    }

    function ASCIIbrokencone() {
      a='\n'
      a+='         =ooooooooooooooooo:\n'
      a+='        +ooooooooooooooooooo.\n'
      a+='       ~oooooooooooooooooooo+\n'
      a+='       =ooooooooooooooooooooo:\n'
      a+='      +ooooooooooooooooooooooo.\n'
      a+='     ~oooooooooooooooooooooooo+\n'
      a+='     =ooooooooooooooooooooooooo:\n'
      a+='    +ooooooooooooooooooooooooooo.\n'
      a+='   ~oooooooooooooooooooooooooooo+\n'
      a+='   =ooooooooooooooooooooooooooooo:\n'
      a+='  +ooooooooooooooooooooooooooooooo.\n'
      a+=' ~=ooooooooooooooooooooooooooooooo+\n'
      a+='.===ooooooooooooooooooooooooooooo=o:\n'
      input('output').textContent=a
      input('output').style.fontSize='11px'
      input('output').style.fontWeight='bold'
    }

    function ASCIIfullcone() {
      a='\n'
      a+='                  ~~\n'
      a+='                 ~oo~\n'
      a+='                ~o=o=~\n'
      a+='               ~o=ooo=\n'
      a+='              ~oooooo==~\n'
      a+='             ~ooooooo===~\n'
      a+='            ~o=ooooooooo=\n'
      a+='           ~ooooooooooooo=~\n'
      a+='          ~o=oooooooooooo==~\n'
      a+='         ~o=ooooooooooooo===~\n'
      a+='        :ooooooooooooooooooo=~\n'
      a+='       ~ooooooooooooooooooooo=~\n'
      a+='      :o=ooooooooooooooooooo===~\n'
      a+='     ~oooooooooooooooooooooooo==~\n'
      a+='    ~o=ooooooooooooooooooooooooo=~\n'
      a+='   :ooooooooooooooooooooooooooooo=~\n'
      a+='  ~o=ooooooooooooooooooooooooooo=o=~\n'
      a+=' :o=oooooooooooooooooooooooooooooo==~\n'
      a+='~o===================================~\n'
      input('output').textContent=a
      input('output').style.fontSize='11px'
      input('output').style.fontWeight='bold'
    }

    function ASCIItorus() {
      a='\n'
      a+='                                                                          MMMM$$$$$$$$$MMM                          \n'
      a+='                                                                MM$$@@###%%%%%%%%%%%%%%%%%##@@$$M                   \n'
      a+='                                                          M$$@##%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%###$$M              \n'
      a+='                                                     M$@#%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%##@$M           \n'
      a+='                                                M$$@%%%%%%%%%%%^%%^^%%^^%^%^%%^%%%%%%%%%%%%%%%%%%%%%%%###@M         \n'
      a+='                                            M$@#%%%%%%%%^%^^^^^^^^^^^^^%^%^%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%##@M       \n'
      a+='                                         $$#%%%%%%^^%^^^^^^^^^^^^^^^%^^^%^^%^^%%%%%%%%%%%%%%%%%%%%%%%%%%%%###$      \n'
      a+='                                     M$@%%%%%^%%^^^^^^^^^^^^^^^^^%^^^^^%^%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%###@M    \n'
      a+='                                  M$#%%%%%^%^^^^^^^^^^^^^^^^^^^^^^^^%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%##@$   \n'
      a+='                                $@%%%%%^^^^^^^^^^^^^^^^^^^^^^^^^^%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%#@@M  \n'
      a+='                             $@%%%%%^^^^^^^^^^^^^^^^^^^^^^^^^^%%%%%%%%%%%%%%%%%#########%#%%%%%%%%%%%%%%%%%%%%###$M \n'
      a+='                          M$#%%%%^^^^^^^^^^^^^^^^^^^^^^^^^^%%%%%%%%%%%#%%%%#######@#######%%%%%%%%%%%%%%%%%%%%###@$ \n'
      a+='                        $@%%%%%%^^^^^^^^^^^^^^^^^^^^^^%^%%%%%%%%%%%######@@@@@$@@$@@@$@@@###%%%%%%%%%%%%%%%%%%%###$M\n'
      a+='                      $#%%%%^%^^^^^^^^^^^^^^^^^^^^^^%%%%%%%%%%%%####@@@$$$$$$$MM$MM$M$$$@@#%%%%%%%%%^^%^%%%%%%####$M\n'
      a+='                    $#%%%%%^^^^^^^^^^^^^^^^^^^^^^%%%%%%%%%####@@@$$$$MMM                M@#%%%%%%^%%^%%%%%%%%%%%##@$\n'
      a+='                  $%%%%%%^^^^^^^^^^^^^^^^^^^^%%%%%%%%%####@@@$$MM                        @%%%%%%%%%^%^%%%%%%%%%%#@@$\n'
      a+='                $#%%%%^^^^^^^^^^^^^^^^^^^%^%%%%%%%%####@$$$M                            M#%%%%%%^^^%^%^%%%%%%%%##@@M\n'
      a+='              $#%%%%^^^^^^^^^^^^^^^^^^%%%%%%%%%%#%#@@$$M                                #%%%%%^^%^^^^^%%%%%%%%%##@$M\n'
      a+='            M@%%%%%%%^^^^^^^^^^^^^^%^^%%%%%%%###@$$MM                                  #%%%%%%%^^^^%^%^%%%%%%%%##@$ \n'
      a+='           $%%%%%%%^^^^^^^^^^^^^^%%%%%%%%%####$$$M                                   M#%%%%^%^^^^%^^%^%^%%%%%%##@@$ \n'
      a+='         M@%%%%%%^^^^^^^^^^^^^^%%%%%%%%%##@@$$M                                     $%%%%%^^^^^^^^^^^%^%%%%%%###@$M \n'
      a+='        $#%%%%%^^%^^%%^%^^%^%^%%%%%%%###@$$M                                      M@%%%%^^^^^^^^^^^^%%^%%%%%%%#@@M  \n'
      a+='       $%%%%%%%%^^%^^^^^%^%%%%%%%%%##@@$$M                                       $%%%%^^^^^^^^^^^^^^%%%%%%%%##@$$   \n'
      a+='      @%%%%%%%^%^%^^^^%%%%%%%%%%%%#@@$$M                                       $#%%%%^^^^^^^^^^^^^%^%%%%%%%##@@$    \n'
      a+='    M@%%%%%%%%^%%^%%%%%%%%%%%%###@@$M                                        $#%%%%^^^^^^^^^^^^^^^^%%%%%%%###@$     \n'
      a+='    @%%%%%%%%%%^%%%%%%%%%%%%####@$$M                                       $#%%%^^^^^^^^^^^^^^^^^^%%%%%%###@@$      \n'
      a+='   @%%%%%%%%%%%%%%%%%%%%%%%###@$$M                                      M$%%%%^^^^^^^^^^^^^^^^^^%%%%%%%%##@$$       \n'
      a+='  $%%%%%%%%%%%%%%%%%%%%%%###@@$M                                      $#%^^^^^^^^^^^^^^^^^^^^^%%%%%%%%###@$$        \n'
      a+=' M#%%%%%%%%%%%%%%%%%%%%#####$$M                                    $@%%^%%^^^^^^^^^^^^^^^^^^^^%%%%%%%##@@$M         \n'
      a+=' $%%%%%%%%%%%%%%%%%%%%####@$$M                                  $@%%%%%^^^^^^^^^^^^^^^^^^^^%%%%%%%%%#@@$$M          \n'
      a+='M#%%%%%%%%%%%%%%%%%%####@@$$M                               M$@%%^%%^^^^^^^^^^^^^^^^^^^^^%^%%%%%%%##@@$M            \n'
      a+='$%%%%%%%%%%%%%%%%%%#%###@$$M                            M$$#%%^%^^^^^^^^^^^^^^^^^^^^^^^%^%%%%%%####@$M              \n'
      a+='$%%%%%%%%%%%%%%%%%%%####@$$                         M$@#%%%^^%%^^^^^^^^^^^^^^^^^^^^^^^%%%%%%%%##@$$M                \n'
      a+='@#%%%%%%%%%%%%%%%%%%%%##@$$                    M$@##%%%^%^%^^^^^^^^^^^^^^^^^^^^^^^%^%%%%%%%###@@$$                  \n'
      a+='@%%%%%%%%%%%%%%%%%%%%%%%##@$MMM      MMM$$$@##%%%%^^%^^^^^^^^^^^^^^^^^^^^^^^^^^^^^%%%%%%%%##@$$$                    \n'
      a+='$#%%%%%%%%%%%%%%%%%%%%%%%%%%%%#%##%#%%%%%%%%%^%%^^^^^^^^^^^^^^^^^^^^^^^^^^^^^%^%%%%%%%####@$$$                      \n'
      a+='$##%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^%%%%%%%%#%##@@$$M                        \n'
      a+=' @#%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%^%%^^%^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^%%%%%%%%%%%####@$$MM                          \n'
      a+=' $###%%%%%%%%%%^%%^^%%^%^^^%^^%^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^%%%%%%%%%%%###@$$$M                             \n'
      a+='  $###%%%%%%%%%%%%%^%^%^%^%^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^%%%%%%%%%%%#####@@$$M                                \n'
      a+='   $###%%%%%%%%%%%%%%^%%^%^^%^%^^%^^^^^^^^^^^^^^^^^^^%^^^^^^%%%%%%%%%%%%####@$$MM                                   \n'
      a+='    $####%%%%%%%%%%%%%%^%%^%^^%^^%^^%^^%^^^^^^^^^^%^^%%%%%%%%%%%%%######@@$$MM                                      \n'
      a+='     M$@####%%%%%%%%%%%%%%%%^%%%^%^%^^%^%%%%^^%%%%%%%%%%%%%%%%%%####@@$$$M                                          \n'
      a+='       M$@@###%#%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%#%######@@$$$M                                              \n'
      a+='         M$$##@###%#%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%#%######@@$$$MM                                                  \n'
      a+='            M$$@@@@#########%%##%%%#%%#%%%#%######@@@@@@$$$MM                                                       \n'
      a+='               MM$$$$@@@################@@#@@@@@@$$$$MM                                                             \n'
      a+='                   MMMMM$$$$$$$$@$$$$$$$$$$$MMM                                                                     \n'
      a+='                                 M                                                                                  \n'
      input('output').textContent=a
      input('output').style.fontSize='5px'
      input('output').style.fontWeight='bold'
    }


    
function circle() {
      d=parseFloat(input('d_circle').value)
      deg=parseFloat(input('deg_circle').value)

      pi=Math.PI

      d=round(d/2)*2

      n=round(360/deg,0) //number of sides

      circle_piece=round(d*Math.tan(pi/n)/2)*2

      valid=(d>=0.06 && deg<=60 && deg>0 && isNearlyInteger(360/deg/2) && circle_piece>=0.06)

      time=n/2*0.0333 //time to load, seems to be about 30 parts/sec + slight decrease with many stacked pieces (because of many joints)
      
      if (valid) {
        out=`================CIRCLE================\n`
        out+=`Number of sides: ${n}\n\n`

        out+=`Diameter: ${d} (amount in scale: ${round(d/2-1)}, both sides)\n`
        out+=`Width: ${circle_piece} (amount in scale: ${round(circle_piece/2-1)}, both sides)\n\n`
        out+=`Degrees for rotating: ${round(deg,2)}\n\n`
        out+=`===DIMENSIONS===\n`
        out+=`Part: ${circle_piece} x ${d} x (THICKNESS)\n`
        out+=complete(deg)
      } else {
        if (d<0.06) {
          out=`ERROR: diameter is smaller than 0.06 (${d})`
        } else if (deg<=0 || deg>60) {
          out=`ERROR: Degrees for rotating aren't bigger than 0 or smaller/equal than 60 (${deg})`
        } else if (circle_piece<0.06) {
          out=`ERROR: Part width is smaller than 0.06, increase diameter or degrees for rotating (width: ${circle_piece})`
        } else if (!isNearlyInteger(360/deg/2)) {
          out=`ERROR: Invalid degrees for rotating (you don't get a full number of pieces or it's not a multiple of 2: ${round(360/deg)})\n\n`
          out+=`List of degrees that would work (choose any):\n`
          for (tn=8;tn<7200;tn+=4) { //checks up to 7200 scenarios for correct degrees for rotating
            td=360/tn;nicenumber=(round(td,2)==td);if(isNearlyInteger(tn/4) && nicenumber){out+=` -degrees: ${360/tn}\n`}
          }
        } else {
          out=`ERROR: Unknown error, comment your values`
        }
      }
      input('output').textContent=out
      input('output').style.fontSize='16px'
      input('output').style.fontWeight='normal'
    }

    function sphere() {
      d=parseFloat(input('d_sphere').value)
      deg=parseFloat(input('deg_sphere').value)

      pi=Math.PI

      d=round(d/2)*2 //changes 1.71 to 1.72 for example (can't scale symetrically for odd last place)
      n=360/deg //number of sides

      circle_piece=round(d*Math.tan(pi/n)/2)*2

      valid=(d>=0.06 && deg<=60 && deg>0 && isNearlyInteger(360/deg/2) && circle_piece>=0.06)

      parts=(n/2)**2 //if 45 degrees then 16 parts
      time=parts*0.0333 //time to load, seems to be about 30 parts/sec + slight decrease with many stacked pieces (because of many joints)
      pt=[d,circle_piece,circle_piece] //dimensions, x, y, z
      gl=n
      gh=n/2
      grid=[gl,gh]

      if (pt[0]*pt[1]*pt[2]/8<1) {
        blocks=parts
        one=1
      } else {
        blocks=round(pt[0]*pt[1]*pt[2]/8,0)*parts
        one=round(pt[0]*pt[1]*pt[2]/8,0)
      }

      if (valid) {
        out=`================SPHERE================\n`
        if (parts>1000) {out+=`WARNING: if you dont make it hollow then you could possibly crash the server (even with a single sphere)\n\n`}

        out+=`Number of pieces: ${parts}\n`
        out+=`Number of blocks: ${blocks} (${one} per part)\n\n`

        out+=`Diameter: ${d} (amount in scale: ${round(d/2-1)}, both sides)\n`
        out+=`Width: ${circle_piece} (amount in scale: ${round(circle_piece/2-1)}, four sides)\n\n`
        out+=`Degrees for rotating: ${round(deg,2)}\n\n`
        out+=`===DIMENSIONS===\n`
        out+=`Part: ${circle_piece} x ${circle_piece} x ${d}\n`
        out+=complete(deg)
      } else {
        if (d<0.06) {
          out=`ERROR: diameter is smaller than 0.06 (${d})`
        } else if (deg<=0 || deg>60) {
          out=`ERROR: Degrees for rotating aren't bigger than 0 or smaller/equal than 60 (${deg})`
        } else if (circle_piece<0.06) {
          out=`ERROR: Part width is smaller than 0.06, increase diameter or degrees for rotating (width: ${circle_piece})`
        } else if (!isNearlyInteger(360/deg/2)) {
        out=`ERROR: Invalid degrees for rotating (you don't get a full number of pieces or it's not a multiple of 2: ${round(360/deg)})\n\n`
        out+=`List of degrees that would work (choose any):\n`
        for (tn=8;tn<7200;tn+=4) { //checks up to 7200 scenarios for correct degrees for rotating
          td=360/tn;nicenumber=(round(td,2)==td);if(isNearlyInteger(tn/4) && nicenumber){out+=` -degrees: ${360/tn}\n`}}
        } else {
          out=`ERROR: Unknown error, comment your values`
        }
      }

      input('output').textContent=out
      input('output').style.fontSize='16px'
      input('output').style.fontWeight='normal'
    }

    function cone() {
      type=input('type').value
      height=parseFloat(input('h_cone').value)
      bottom_d=parseFloat(input('d_bot_cone').value)
      top_d=parseFloat(input('d_top_cone').value)
      deg=parseFloat(input('deg_cone').value)

      n=360/deg

      circle_bottom=round(bottom_d*Math.tan(Math.PI/n)/2)*2
      if (type==`broken`) {
        circle_top=round(top_d*Math.tan(Math.PI/n)/2)*2
      } else {
        circle_top=0
        top_d=0
      }

      tilt_angle=round(Math.atan(height/(bottom_d/2-top_d/2))*180/Math.PI,2) //angle between base and cone wall
      shape_height=round(Math.sqrt(height**2+(bottom_d/2-top_d/2)**2))
      alpha=round(Math.atan(shape_height/(circle_bottom/2-circle_top/2))*180/Math.PI,2) //angle between the bottom and the side of the triangle/trapezoid
      side=round(Math.sqrt(shape_height**2 + (circle_bottom/2-circle_top/2)**2))
      
      valid=(height>=0.05 && deg<=60 && deg>0 && isNearlyInteger(360/deg/2) && circle_bottom>=0.06 && !(type=='broken' && top_d<0.06))

      if (valid) {
        if (top_d==0) { //TRIANGLE SHAPE
          tri_base=round((bottom_d * Math.tan(Math.PI/n))/2)*2

          out=`==========CONE==========\n`
          out+=`Bottom diameter: ${bottom_d} (amount in scale: ${round(bottom_d/2-1)})\n`
          out+=`Bottom circle piece: ${circle_bottom} (amount in scale: ${round(circle_bottom/2-1)})\n`
          out+=`Bottom height: 0.05 (amount in scale: 1.95)\n\n`

          out+=`Triangle tilt angle: ${tilt_angle} deg\n`
          out+=`Length: 0.05 (amount in scale: ${round(bottom_d-0.06)})\n\n`

          out+=`Quadrouple mirror on new piece and angle by ${alpha}\n\n`

          out+=`Triangle vertical side lengths: ${side} (amount in scale: ${round(side-circle_bottom)})\n`
          out+=`Fill in the rest of empty space\n\n`

          out+=`Mirror it to the other side\n\n`

          out+=`Degrees for rotating: ${round(deg,2)}\n`
        } else { //TRAPEZOID SHAPE
          trap_top=round((top_d * Math.tan(Math.PI/n))/2)*2
          trap_bottom=round((bottom_d * Math.tan(Math.PI/n))/2)*2

          out=`==========CONE==========\n`
          out+=`Bottom diameter: ${bottom_d} (amount in scale: ${round(bottom_d/2-1)})\n`
          out+=`Bottom circle piece: ${circle_bottom} (amount in scale: ${round(circle_bottom/2-1)})\n`
          out+=`Bottom height: 0.05 (amount in scale: 1.95)\n\n`

          out+=`Trapezoid tilt angle: ${tilt_angle} deg\n`
          out+=`Length: 0.05 (amount in scale: ${round(bottom_d-0.06)})\n\n`

          out+=`Quadrouple mirror on new piece and angle by ${alpha}\n\n`

          out+=`Trapezoid vertical side lengths: ${side} (amount in scale: ${round(side-circle_bottom)})\n`
          out+=`Clone bottom piece of trapezoid upwards by ${round(shape_height-0.05)}\n`
          out+=`Trapezoid top length: ${trap_top} (amount in scale: ${round((circle_top-circle_bottom)/2)})\n`
          out+=`Trapezoid bottom length: ${trap_bottom} (amount in scale: ${round(circle_bottom/2-1)})\n\n`

          out+=`Scale down the top of the trapezoid using: ${round(shape_height-0.1)}\n`
          out+=`Fill in the rest of empty space\n\n`

          out+=`Mirror it to the other side\n\n`

          out+=`Clone the bottom piece up by ${round(height-0.05)}\n`
          out+=`Top diameter: ${top_d} (amount in scale: ${round((bottom_d-top_d)/2)})\n`
          out+=`Top circle piece: ${circle_top} (amount in scale: ${round((circle_bottom-circle_top)/2)})\n\n`

          out+=`Degrees for rotating: ${round(360/n,2)}\n`
        }
        out+=complete(deg)
      } else {
        if (height<0.05) {
          out=`ERROR: height is smaller than 0.05 (entered ${height})`
        } else if (circle_bottom<0.06) {
          out=`ERROR: bottom circle piece is smaller than 0.06 (increase diameter or degrees for rotating)`
        } else if (type=='broken' && top_d<0.06) {
          out=`ERROR: top diameter is smaller than 0.06 (${top_d})`
        } else if (top_d>bottom_d) {
          out=`ERROR: top diameter is bigger than bottom diameter`
        } else if (!isNearlyInteger(360/deg/2)) {
        out=`ERROR: Invalid degrees for rotating (you don't get a full number of pieces or it's not a multiple of 2: ${round(360/deg)})\n\n`
        out+=`List of degrees that would work (choose any):\n`
        for (tn=8;tn<7200;tn+=4) { //checks up to 7200 scenarios for correct degrees for rotating
          td=360/tn;nicenumber=(round(td,2)==td);if(isNearlyInteger(tn/4) && nicenumber){out+=` -degrees: ${360/tn}\n`}}
        } else {
          out=`ERROR: Unknown error, comment the values you used`
        }
      }

      input('output').textContent=out
      input('output').style.fontSize='16px'
      input('output').style.fontWeight='normal'
    }

    function torus() {
      outer_d=parseFloat(input('out_d_torus').value)
      inner_d=parseFloat(input('in_d_torus').value)
      d=parseFloat(input('deg_torus').value)
      dd=parseFloat(input('ddeg_torus').value) //donut degrees

      radius = (outer_d+inner_d)/4  //radius top down
      cross = (outer_d-inner_d)/4 //cross section radius
      q = round(360/d)
      qd = round(360/dd)
      base_CP = 2*round(cross*Math.tan(Math.PI/q)) //center piece for cross section circle only

      out=`================TORUS================\n`
      out+=`Cross section diameter: ${round(cross*2)} (amount in scale: ${round((cross*2)/2-1)})\n`
      out+=`Cross section piece height: ${round(base_CP)} (amount in scale: ${round(base_CP/2-1)})\n`
      out+=`Cross section piece width: ${round(base_CP)} (amount in scale: ${round(base_CP/2-1)})\n`
      
      valid=(outer_d>inner_d && d<=60 && d>0 && dd<=60 && dd>0 && outer_d>=0.06 && inner_d>=0.06 && isNearlyInteger(360/d/4) && isNearlyInteger(360/dd/2))

      if (valid) {
        out+=`Degrees for rotating the cross section: ${round(360/q,2)}\n\n`

        for (i=0;i<Math.floor(q/4+1);i++) {
          gap_fix = base_CP/2*Math.cos(Math.PI/180 * i*360/q)
          position = radius + cross*Math.cos(Math.PI/2 - Math.PI/180 * i*360/q) + gap_fix
          length = 2*round((2*position*Math.tan(Math.PI/qd)/2))
          AIS = round((length - base_CP)/2)
          out+=`-${i+1}th piece length: ${round(length)} (amount in scale: ${AIS})`
          if (i==0) {
            out+=` the piece at the bottom and top\n`
          } else if (i==1) {
            out+=` move outwards now from top and bottom\n`
          } else {
            out+=`\n` 
          }
        }
        out+=`\nClone it to the other side using ${round(2*radius)}\n`
        out+=`Degrees for rotating the entire donut: ${round(360/qd,2)}\n\n`
        if (d!=dd) {out+=complete(d);out+=complete(dd)} else {out+=complete(d)}
      } else {
        if (d>60 || d<0) {
          out=`ERROR: Degrees for cross section aren't in 0 to 60 range (entered ${d})\n`
        } else if (dd>60 || dd<0) {
          out=`ERROR: Degrees for cloning it into a donut aren't in 0 to 60 range (entered ${d})\n`
        } else if (outer_d<0.06) {
          out=`ERROR: Outer diameter is too small (must be atleast 0.06, not ${outer_d})\n`
        } else if (inner_d<0.06) {
          out=`ERROR: Outer diameter is too small (must be atleast 0.06, not ${outer_d})\n`
        } else if (outer_d<=inner_d) {
          out=`ERROR: Outer diameter has to be strictly bigger than inner diameter\n`
        } else if (!isNearlyInteger(360/d/4)) {
          out=`ERROR: Invalid number of degrees for section (you don't get a full number of pieces or it's not a multiple of 4: ${round(360/d)})\n\n`
          out+=`List of degrees that would work (choose any):\n`
          for (tn=8;tn<7200;tn+=4) { //checks up to 7200 scenarios for correct degrees for rotating
            td=360/tn;nicenumber=(round(td,2)==td);if(isNearlyInteger(tn/4) && nicenumber){out+=` -degrees: ${360/tn}\n`}}
        } else if (!isNearlyInteger(360/dd/2)) {
          out=`ERROR: Invalid number of degrees for donut (you don't get a full number of pieces or it's not a multiple of 2: ${round(360/d)})\n\n`
          out+=`List of degrees that would work (choose any):\n`
          for (tn=8;tn<7200;tn+=4) { //checks up to 7200 scenarios for correct degrees for rotating
            td=360/tn;nicenumber=(round(td,2)==td);if(isNearlyInteger(tn/2) && nicenumber){out+=` -degrees: ${360/tn}\n`}}
        } else {
          out=`ERROR: Unknown (comment which values you used)`
        }
      }

      input('output').textContent=out
      input('output').style.fontSize='16px'
      input('output').style.fontWeight='normal'
    }

    
/* ════════════════════════════════════════════════════════════════════
   PRESENTASI — semua kode di bawah ini BARU (bukan bagian kalkulasi).
   Mengikuti standar design.md: panel #0e1420 + border #1e293b radius 14,
   aksen teal Shapes (hsl 170), Orbitron (judul) + Inter (body),
   tombol back pola GearsPage, icon lucide (bukan emoji).
   ════════════════════════════════════════════════════════════════════ */

const MODES = [
    { id: 'circle', label: 'Circle', icon: Circle },
    { id: 'sphere', label: 'Sphere', icon: Globe },
    { id: 'cone', label: 'Cone', icon: Cone },
    { id: 'torus', label: 'Torus', icon: Donut },
];

// Dispatcher mode -> fungsi tampilan original (dipanggil PERSIS, tanpa logika tambahan).
const MODE_FN = {
    circle: circleinputs,
    sphere: sphereinputs,
    cone: coneinputs,
    torus: torusinputs,
};

// Referensi style SHARED (bukan object literal per-render) supaya React
// style-diff tidak pernah menimpa hasil manipulasi display() dari script
// original saat komponen re-render (mis. saat state `mode` berubah).
const hiddenRow = { display: 'none' };

const cardStyle = {
    backgroundColor: '#0e1420',
    border: '1px solid #1e293b',
    borderRadius: 14,
};

const fieldLabelStyle = {
    display: 'block',
    fontFamily: 'Inter,sans-serif',
    fontSize: 12,
    fontWeight: 600,
    color: '#94a3b8',
    marginBottom: 6,
};

const fieldInputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px',
    borderRadius: 10,
    backgroundColor: '#181b24',
    border: '1px solid #1e293b',
    color: '#e2e8f0',
    fontFamily: 'Inter,sans-serif',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
};

const backBtnStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    borderRadius: 10,
    backgroundColor: '#0e1420',
    border: '1px solid #1e293b',
    color: '#64748b',
    cursor: 'pointer',
    fontFamily: 'Inter,sans-serif',
    fontSize: 13,
    fontWeight: 600,
    transition: 'color 0.2s',
};

const calcBtnStyle = {
    width: '100%',
    display: 'none',
    padding: '13px 0',
    borderRadius: 12,
    border: 'none',
    cursor: 'pointer',
    background: 'linear-gradient(180deg,#2dd4bf 0%,#14b8a6 100%)',
    color: '#052e24',
    fontFamily: 'Orbitron,sans-serif',
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
    boxShadow: '0 4px 16px rgba(45,212,191,0.22)',
    transition: 'transform 0.15s ease, box-shadow 0.2s ease',
};

// Helper presentasi (tidak menyentuh kalkulasi).
const fieldFocus = e => { e.currentTarget.style.borderColor = '#2dd4bf'; };
const fieldBlur = e => { e.currentTarget.style.borderColor = '#1e293b'; };
const calcPress = e => {
    e.currentTarget.style.transform = 'translateY(2px)';
    e.currentTarget.style.boxShadow = '0 2px 8px rgba(45,212,191,0.18)';
};
const calcRelease = e => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '0 4px 16px rgba(45,212,191,0.22)';
};
const backHoverIn = c => { c.currentTarget.style.color = '#e2e8f0'; };
const backHoverOut = c => { c.currentTarget.style.color = '#64748b'; };

// Row input angka — id ada di DIV row (dipakai display() original),
// input di dalamnya tetap membawa id original (dipakai fungsi hitung).
function Field({ rowId, inputId, label, defaultValue }) {
    return (
        <div id={rowId} style={hiddenRow}>
            <label htmlFor={inputId} style={fieldLabelStyle}>{label}</label>
            <input
                id={inputId}
                type="number"
                step="any"
                defaultValue={defaultValue}
                style={fieldInputStyle}
                onFocus={fieldFocus}
                onBlur={fieldBlur}
            />
        </div>
    );
}

// Row link tutorial — teks link & href PERSIS dari original.
function TutorialRow({ rowId, href, linkText }) {
    return (
        <div id={rowId} style={hiddenRow}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
                padding: '9px 12px',
                borderRadius: 10,
                backgroundColor: 'rgba(45,212,191,0.08)',
                border: '1px solid rgba(45,212,191,0.22)',
            }}>
                <Youtube size={14} color="#ef4444" style={{ flexShrink: 0 }} />
                <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: '#94a3b8' }}>Explained in:</span>
                <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600, color: '#5eead4', textDecoration: 'none', borderBottom: '1px dotted rgba(94,234,212,0.45)' }}
                >{linkText}</a>
            </div>
        </div>
    );
}

// Tombol Calculate — id original (di-toggle display()) + onClick langsung
// ke fungsi hitung original (PERSIS, tanpa wrapper).
function CalcButton({ id, onClick }) {
    return (
        <button
            id={id}
            onClick={onClick}
            style={calcBtnStyle}
            onMouseDown={calcPress}
            onMouseUp={calcRelease}
            onMouseLeave={calcRelease}
        >Calculate</button>
    );
}

export default function ShapesCalculator({ setPage }) {
    // State React HANYA untuk highlight tab mode aktif (presentasi).
    // Show/hide row input tetap 100% via fungsi display() script original.
    const [mode, setMode] = useState(null);

    return (
        <div style={{ width: '100%', maxWidth: 540 }}>

            {/* Back — pola tombol back GearsPage/LinkagesPage */}
            <div style={{ display: 'flex', marginBottom: 18 }}>
                <button
                    onClick={() => setPage('shapes')}
                    style={backBtnStyle}
                    onMouseEnter={backHoverIn}
                    onMouseLeave={backHoverOut}
                >
                    <ArrowLeft size={15} /> Back
                </button>
            </div>

            {/* Header — icon badge + judul gradient teal (pola Shapes family) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 10 }}>
                <div style={{ backgroundColor: 'rgba(45,212,191,0.18)', padding: 12, borderRadius: 12, color: '#2dd4bf' }}>
                    <Calculator size={32} />
                </div>
                <h1 style={{
                    fontFamily: 'Orbitron,sans-serif',
                    fontWeight: 900,
                    fontSize: 'clamp(1.6rem,6vw,2.2rem)',
                    background: 'linear-gradient(180deg,#5eead4 0%,#14b8a6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.01em',
                    margin: 0,
                }}>SHAPES CALCULATOR</h1>
            </div>

            <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, color: '#94a3b8', lineHeight: 1.6, margin: '0 0 20px', textAlign: 'center' }}>
                Kalkulator dimensi part untuk membangun Circle, Sphere, Cone, dan Torus (donat) di Build A Boat — jumlah sisi, ukuran part, dan derajat rotasi, semua dalam satuan studs.
            </p>

            {/* Mode selector — pengganti 4 tombol polos original.
                onClick: setMode utk highlight tab + panggil fungsi
                tampilan original PERSIS. */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, padding: 5, ...cardStyle, marginBottom: 14 }}>
                {MODES.map(m => {
                    const Icon = m.icon;
                    const active = mode === m.id;
                    return (
                        <button
                            key={m.id}
                            onClick={() => {
                                setMode(m.id);
                                MODE_FN[m.id]();
                                // FIX VISIBILITY (disetujui user — memory.md
                                // Bagian 64): cone9 (Top diameter) tidak ada
                                // di lcone, jadi tidak di-toggle display()
                                // saat pindah mode — sinkronkan manual: tampil
                                // hanya di mode Cone + type Broken.
                                const topD = m.id === 'cone' && input('type').value === 'broken';
                                input('cone9').style.display = topD ? '' : 'none';
                                if (topD) ASCIIbrokencone(); // coneinputs() sudah set ASCIIfullcone()
                            }}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                padding: '11px 4px 12px',
                                borderRadius: 10,
                                cursor: 'pointer',
                                border: `1px solid ${active ? 'rgba(45,212,191,0.4)' : 'transparent'}`,
                                backgroundColor: active ? 'rgba(45,212,191,0.14)' : 'transparent',
                                color: active ? '#5eead4' : '#94a3b8',
                                fontFamily: 'Inter,sans-serif',
                                fontSize: 11,
                                fontWeight: 600,
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={c => { if (mode !== m.id) c.currentTarget.style.color = '#e2e8f0'; }}
                            onMouseLeave={c => { if (mode !== m.id) c.currentTarget.style.color = '#94a3b8'; }}
                        >
                            <Icon size={18} />
                            {m.label}
                        </button>
                    );
                })}
            </div>

            {/* Panel input — semua row membawa ID original supaya fungsi
                display() script original bekerja tanpa perubahan.
                Semua row statis (slot children stabil) supaya manipulasi
                DOM langsung dari display() tidak pernah di-reset React. */}
            <div style={{ ...cardStyle, padding: 18, display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 14 }}>
                {mode === null && (
                    <p style={{ margin: 0, padding: '24px 0', textAlign: 'center', fontFamily: 'Inter,sans-serif', fontSize: 13, color: '#475569' }}>
                        Pilih bentuk di atas untuk mulai menghitung.
                    </p>
                )}

                {/* — CIRCLE — */}
                <TutorialRow rowId="circle0" href="https://www.youtube.com/watch?v=61LKh3vMcQA" linkText="Build a Boat - Circle tutorial" />
                <Field rowId="circle3" inputId="d_circle" label="Circle diameter (studs)" defaultValue={10} />
                <Field rowId="circle5" inputId="deg_circle" label="Degrees for rotating (smaller number = smoother)" defaultValue={15} />

                {/* — SPHERE — */}
                <TutorialRow rowId="sphere0" href="https://www.youtube.com/watch?v=Ff6ipyaaz-s" linkText="Build a Boat - Sphere tutorial" />
                <Field rowId="sphere3" inputId="d_sphere" label="Sphere diameter (studs)" defaultValue={20} />
                <Field rowId="sphere5" inputId="deg_sphere" label="Degrees for rotating (smaller number = smoother)" defaultValue={22.5} />

                {/* — CONE — */}
                <TutorialRow rowId="cone0" href="https://www.youtube.com/" linkText="Not uploaded yet..." />
                <div id="cone3" style={hiddenRow}>
                    <label htmlFor="type" style={fieldLabelStyle}>Cone type</label>
                    <div style={{ position: 'relative' }}>
                        <select
                            id="type"
                            defaultValue="full"
                            onChange={e => {
                                // FIX VISIBILITY (disetujui user — memory.md Bagian 64):
                                // original men-toggle cone7 (Bottom diameter) di sini —
                                // kebalik dari intent komentar HTML original. Toggle
                                // sekarang ke cone9 (Top diameter): hanya tampil utk
                                // Broken. Bottom diameter (cone7) selalu tampil di mode
                                // Cone via lcone. Fungsi ASCII tetap PERSIS original.
                                if (e.target.value === 'broken') {
                                    input('cone9').style.display = ''
                                    ASCIIbrokencone()
                                } else {
                                    input('cone9').style.display = 'none'
                                    ASCIIfullcone()
                                }
                            }}
                            style={{ ...fieldInputStyle, appearance: 'none', WebkitAppearance: 'none', padding: '10px 34px 10px 12px', cursor: 'pointer' }}
                            onFocus={fieldFocus}
                            onBlur={fieldBlur}
                        >
                            <option value="full">Full (with peak)</option>
                            <option value="broken">Broken</option>
                        </select>
                        <ChevronDown size={15} color="#64748b" style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    </div>
                </div>
                <Field rowId="cone5" inputId="h_cone" label="Cone height (studs)" defaultValue={10} />
                <Field rowId="cone7" inputId="d_bot_cone" label="Bottom diameter (studs)" defaultValue={8} />
                <Field rowId="cone9" inputId="d_top_cone" label="Top diameter (studs)" defaultValue={6} />
                <Field rowId="cone11" inputId="deg_cone" label="Degrees for rotating (smaller number = smoother)" defaultValue={15} />

                {/* — TORUS — */}
                <TutorialRow rowId="torus0" href="https://www.youtube.com/" linkText="Not uploaded yet..." />
                <Field rowId="torus3" inputId="out_d_torus" label="Outer diameter (studs)" defaultValue={10} />
                <Field rowId="torus5" inputId="in_d_torus" label="Inner diameter (studs)" defaultValue={1} />
                <Field rowId="torus7" inputId="deg_torus" label="Degrees for rotating cross section (smaller number = smoother)" defaultValue={15} />
                <Field rowId="torus9" inputId="ddeg_torus" label="Degrees for cloning it into a donut/torus" defaultValue={15} />

                {/* Tombol Calculate — id + fungsi hitung original PERSIS */}
                <CalcButton id="calc_circle" onClick={circle} />
                <CalcButton id="calc_sphere" onClick={sphere} />
                <CalcButton id="calc_cone" onClick={cone} />
                <CalcButton id="calc_torus" onClick={torus} />
            </div>

            {/* Panel output — <pre id="output"> PERSIS seperti original:
                fungsi ASCII* & fungsi hitung menulis textContent serta
                fontSize/fontWeight langsung ke elemen ini. */}
            <div style={{ ...cardStyle, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <Terminal size={13} color="#2dd4bf" />
                    <span style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: 2, color: '#475569' }}>OUTPUT</span>
                </div>
                <pre
                    id="output"
                    style={{
                        margin: 0,
                        fontFamily: "'Cascadia Code','JetBrains Mono','Fira Code',Consolas,'Courier New',monospace",
                        whiteSpace: 'pre',
                        overflowX: 'auto',
                        color: '#e2e8f0',
                        fontSize: 14,
                        fontWeight: 'normal',
                        lineHeight: 1.6,
                        textAlign: 'left',
                    }}
                >(Choose a mode)</pre>
            </div>

            {/* Versi & atribusi kalkulator original — teks PERSIS */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14 }}>
                <Youtube size={12} color="#475569" />
                <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#475569' }}>v1.2.1 (YouTube: @dabl2829)</span>
            </div>
        </div>
    );
}
