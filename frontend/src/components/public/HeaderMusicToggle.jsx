import { useEffect, useRef, useState } from "react";
import { FiMusic, FiVolumeX } from "react-icons/fi";
import soundUrl from "../../assets/audio/sound.mp3";
import styles from "./PublicHeader.module.css";

const MUSIC_ENABLED_KEY = "fitme.userMusicEnabled";

export function HeaderMusicToggle() {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(() => localStorage.getItem(MUSIC_ENABLED_KEY) === "true");

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.loop = true;
    audio.volume = 0.42;

    if (!isPlaying) {
      audio.pause();
      return;
    }

    const playRequest = audio.play();
    if (playRequest) {
      playRequest.catch(() => {
        setIsPlaying(false);
        localStorage.setItem(MUSIC_ENABLED_KEY, "false");
      });
    }
  }, [isPlaying]);

  function handleToggle() {
    setIsPlaying((current) => {
      const next = !current;
      localStorage.setItem(MUSIC_ENABLED_KEY, String(next));
      return next;
    });
  }

  const Icon = isPlaying ? FiMusic : FiVolumeX;

  return (
    <>
      <audio ref={audioRef} src={soundUrl} preload="auto" />
      <button
        aria-label={isPlaying ? "Stop music" : "Play music"}
        aria-pressed={isPlaying}
        className={`${styles.musicButton} ${isPlaying ? styles.musicButtonActive : ""}`}
        title={isPlaying ? "Music on" : "Music off"}
        type="button"
        onClick={handleToggle}
      >
        <Icon aria-hidden="true" />
      </button>
    </>
  );
}
