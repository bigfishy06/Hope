library(dplyr)
library(jsonlite)

# ── Load pitch data ────────────────────────────────────────────────────────────
pitches <- read.csv("C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/pitches_clean.csv",
                    stringsAsFactors = FALSE)

# ── Classify each pitch outcome ───────────────────────────────────────────────
pitches <- pitches %>%
  mutate(
    is_single       = Outcome == "Single",
    is_double       = Outcome == "Double",
    is_triple       = Outcome == "Triple",
    is_hr           = Outcome == "Home Run",
    is_hit          = is_single | is_double | is_triple | is_hr,
    is_bb           = Outcome %in% c("Walk", "Intentional Walk"),
    is_ibb          = Outcome == "Intentional Walk",
    is_hbp          = Outcome == "Hit By Pitch",
    is_k            = Outcome %in% c("Strikeout Looking", "Strikeout Swinging"),
    is_k_looking    = Outcome == "Strikeout Looking",
    is_k_swinging   = Outcome == "Strikeout Swinging",
    is_sf           = Outcome == "Sacrifice Fly",
    is_sb           = Outcome == "Sacrifice Bunt",
    is_ci           = Outcome == "Catcher's Interference",
    # AB excludes: BB, IBB, HBP, SF, SB, CI
    is_ab           = !(Outcome %in% c("Walk", "Intentional Walk", "Hit By Pitch",
                                        "Sacrifice Fly", "Sacrifice Bunt",
                                        "Catcher's Interference",
                                        "Ball", "Called Strike", "Swinging Strike",
                                        "Foul", "Pickoff")),
    # Plate appearance = final outcome of PA (exclude mid-PA pitches)
    is_pa           = !(Outcome %in% c("Ball", "Called Strike", "Swinging Strike",
                                        "Foul", "Pickoff"))
  )

# ── Aggregate per batter ───────────────────────────────────────────────────────
summary_stats <- pitches %>%
  group_by(Batter, Batter_Team) %>%
  summarise(
    PA   = sum(is_pa),
    AB   = sum(is_ab),
    H    = sum(is_hit),
    `1B` = sum(is_single),
    `2B` = sum(is_double),
    `3B` = sum(is_triple),
    HR   = sum(is_hr),
    BB   = sum(is_bb),
    IBB  = sum(is_ibb),
    HBP  = sum(is_hbp),
    K    = sum(is_k),
    K_L  = sum(is_k_looking),
    K_S  = sum(is_k_swinging),
    SF   = sum(is_sf),
    SB   = sum(is_sb),   # Sacrifice Bunt
    CI   = sum(is_ci),
    pitches_seen = n(),
    .groups = "drop"
  ) %>%
  mutate(
    # AVG = H / AB
    AVG = ifelse(AB > 0, round(H / AB, 3), 0),

    # SLG = (1B + 2*2B + 3*3B + 4*HR) / AB
    SLG = ifelse(AB > 0, round((`1B` + 2*`2B` + 3*`3B` + 4*HR) / AB, 3), 0),

    # OBP = (H + BB + HBP + CI) / (AB + BB + HBP + SF + SB)
    OBP = ifelse(
      (AB + BB + HBP + SF + SB) > 0,
      round((H + BB + HBP + CI) / (AB + BB + HBP + SF + SB), 3),
      0
    ),

    OPS = round(OBP + SLG, 3)
  ) %>%
  rename(
    batter      = Batter,
    batter_team = Batter_Team
  )

# ── Pitch mix per batter ───────────────────────────────────────────────────────
pitch_mix <- pitches %>%
  group_by(Batter, Pitch_Type) %>%
  summarise(n = n(), .groups = "drop") %>%
  group_by(Batter) %>%
  mutate(pct = round(n / sum(n) * 100, 1)) %>%
  summarise(
    pitch_mix = list(setNames(as.list(pct), Pitch_Type)),
    .groups = "drop"
  ) %>%
  rename(batter = Batter)

# ── Zone stats per batter ──────────────────────────────────────────────────────
zone_stats <- pitches %>%
  group_by(Batter) %>%
  summarise(
    zone_pct    = round(mean(!is.na(Pitch_Location_X) &
                               abs(Pitch_Location_X) <= 1 &
                               Pitch_Location_Y >= 0 &
                               Pitch_Location_Y <= 1, na.rm = TRUE) * 100, 1),
    swinging_k  = sum(is_k_swinging),
    called_k    = sum(is_k_looking),
    chase_pitches = sum(!is.na(Pitch_Location_X) &
                          (abs(Pitch_Location_X) > 1 |
                           Pitch_Location_Y < 0 |
                           Pitch_Location_Y > 1) &
                          Outcome %in% c("Swinging Strike", "Foul"), na.rm = TRUE),
    .groups = "drop"
  ) %>%
  rename(batter = Batter)

# ── Join everything ────────────────────────────────────────────────────────────
final <- summary_stats %>%
  left_join(pitch_mix,  by = "batter") %>%
  left_join(zone_stats, by = "batter")

# ── Write JSON ─────────────────────────────────────────────────────────────────
write_json(final,
           "C:/Users/chris/OneDrive/Documents/summary.json",
           auto_unbox = TRUE, pretty = TRUE, na = "null")

cat("Done! summary.json written with", nrow(final), "players\n")
cat("Columns:", paste(names(final), collapse = ", "), "\n")
