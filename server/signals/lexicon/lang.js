// L16 language mode: Roman-Hindi and English function-word lists (closed-class words only, so content words in either
// script do not decide it). Devanagari tokens always count as Hindi.
import { norm } from "../text.js";

export const ROMAN_HI = new Set(["hai", "hain", "nahi", "nahin", "kya", "main", "mai", "mujhe", "mera", "meri", "mere", "aap", "tum",
  "ka", "ki", "ke", "ko", "se", "toh", "bhi", "ye", "yeh", "wo", "woh", "haan", "kar", "karo", "karna", "tha", "thi", "ho", "raha",
  "rahi", "aur", "par", "mein", "ek", "do", "teen", "char", "paanch", "kyun", "kaise", "kitna", "kitne", "accha", "achha", "acha",
  "matlab", "lekin", "phir", "fir", "abhi", "bahut", "thoda", "sab", "kuch", "pata", "samajh", "aaya", "gaya", "gayi", "hota", "hoti",
  "wala", "wali", "batao", "bolo", "didi", "bhaiya", "ji", "na", "ya", "isko", "usko", "iska", "uska", "agar", "shayad", "lagta",
  "sakta", "chahiye", "hum", "humko", "jaisa", "jaise", "kab", "kahan", "kaun", "nahi", "bilkul", "sahi", "galat", "jawab"].map(norm));
export const EN = new Set(["the", "is", "are", "was", "were", "i", "you", "it", "this", "that", "and", "or", "but", "because", "so",
  "what", "why", "how", "when", "where", "who", "which", "a", "an", "of", "to", "in", "on", "for", "with", "my", "your", "we", "they",
  "not", "no", "yes", "can", "do", "does", "did", "think", "know", "dont", "answer", "will", "would", "should", "be", "have", "has",
  "there", "then", "if", "maybe", "sure", "right", "wrong", "one", "two", "three", "four", "five", "me", "am", "im", "its", "let",
  "try", "again", "please", "okay", "ok", "like", "just", "also", "very", "more", "same", "different"].map(norm));
