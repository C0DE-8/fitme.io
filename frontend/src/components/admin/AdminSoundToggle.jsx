import { useEffect, useRef, useState } from "react";
import { FiVolume2, FiVolumeX } from "react-icons/fi";
import soundUrl from "../../assets/audio/sound.mp3";
import notePrimary from "../../assets/audio/images/music-note.svg";
import noteSmall from "../../assets/audio/images/music-note0.svg";
import noteDouble from "../../assets/audio/images/music-note2.svg";
import styles from "./AdminSoundToggle.module.css";

const SOUND_ENABLED_KEY = "fitme.adminSoundEnabled";

export function AdminSoundToggle({ collapsed = false }) {
  const audioRef = useRef(null);
  const [isOn, setIsOn] = useState(() => localStorage.getItem(SOUND_ENABLED_KEY) === "true");

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.loop = true;
    audio.volume = 0.42;

    if (!isOn) {
      audio.pause();
      return;
    }

    const playRequest = audio.play();
    if (playRequest) {
      playRequest.catch(() => {
        setIsOn(false);
        localStorage.setItem(SOUND_ENABLED_KEY, "false");
      });
    }
  }, [isOn]);

  function handleToggle() {
    setIsOn((current) => {
      const next = !current;
      localStorage.setItem(SOUND_ENABLED_KEY, String(next));
      return next;
    });
  }

  const Icon = isOn ? FiVolume2 : FiVolumeX;

  return (
    <div className={`${styles.soundPanel} ${isOn ? styles.playing : ""} ${collapsed ? styles.collapsed : ""}`}>
      <audio ref={audioRef} src={soundUrl} preload="auto" />
      <button
        aria-label={isOn ? "Turn admin sound off" : "Turn admin sound on"}
        aria-pressed={isOn}
        className={styles.soundButton}
        title={isOn ? "Sound on" : "Sound off"}
        type="button"
        onClick={handleToggle}
      >
        <span className={styles.visual} aria-hidden="true">
          <img className={`${styles.note} ${styles.noteOne}`} src={notePrimary} alt="" />
          <img className={`${styles.note} ${styles.noteTwo}`} src={noteSmall} alt="" />
          <img className={`${styles.note} ${styles.noteThree}`} src={noteDouble} alt="" />
          <Icon className={styles.volumeIcon} />
        </span>
        <span className={styles.copy}>
          <strong>{isOn ? "Sound on" : "Sound off"}</strong>
          <small>{isOn ? "Beat effect active" : "Tap to play sound"}</small>
        </span>
      </button>
    </div>
  );
}
