# Design notes: Semester Wall

## Concept

A printed term chart pinned above a desk. Calm paper with a faint grid, course-coded blocks like coloured index tabs, and one memorable element: the **week load gauge**, a slim four-segment bar beside every calendar week that fills according to how many open deadlines fall in it. Everything else stays quiet so the gauge and the course tabs carry the personality.

## First idea, and what changed

The first idea was a cream page, a serif headline, a terracotta accent, and a row of stat cards (deadlines, classes, courses) with icons. That is the default look for a "planner", and it was also on the do-not-use list. Changes made after review:

- Paper is a cool pale sage (`#EEF1EA`), the accent is a marker magenta (`#A0185C`), and ink is deep pine (`#1B2928`). No cream, no terracotta.
- The stat cards were dropped. Workload is shown where it belongs: beside each week, as the gauge.
- Course colours are pastel "tabs" with dark ink text and a darker left edge, so the code is always readable text.
- Structure carries information: a thick top rule on the header, hard offset shadows only on things that float (toast, dialog), a dashed border only on empty states.

## Colour (measured with the WCAG formula)

| Name | Hex | Role | Contrast |
| --- | --- | --- | --- |
| paper | `#EEF1EA` | page | ink on paper 13.2:1 |
| sheet | `#FBFCF8` | cards, calendar cells | ink on sheet 14.6:1 |
| ink | `#1B2928` | text, borders | |
| ink-soft | `#455452` | secondary text, input borders | 7.0:1 on paper, 7.7:1 on sheet |
| rule | `#B7C0B1` | faint grid (decoration only) | 1.65:1, never carries information |
| pin | `#A0185C` | primary actions, today, overdue | white on pin 7.6:1, pin on paper 6.6:1 |
| pin-soft | `#F7DDE9` | hover and selected day | ink on pin-soft 11.8:1 |

| Course colour | Tab | Ink text on tab | Edge (borders only) | Edge vs paper |
| --- | --- | --- | --- | --- |
| blue | `#9CC3F0` | 8.2:1 | `#2F6DB5` | 4.6:1 |
| green | `#9AD6A9` | 9.0:1 | `#2E8049` | 4.3:1 |
| orange | `#F4BC78` | 8.8:1 | `#B8661A` | 3.7:1 |
| purple | `#C6B0EC` | 7.8:1 | `#6D4DB3` | 5.5:1 |
| teal | `#7ED3CF` | 8.7:1 | `#1B7C78` | 4.4:1 |
| rose | `#F2A9BF` | 8.0:1 | `#B8416A` | 4.6:1 |

## Type

- **Zilla Slab** (display): headings and the app name. A stamped, wall-chart feel.
- **Familjen Grotesk** (text and UI): readable at small sizes in a dense calendar.

## Layout

Desktop: calendar left, selected-day panel right (22rem). A week is a table row: gauge, then Monday to Sunday.

```
+-------------------------------------------------+---------------------+
| October 2026      [Previous] [Today] [Next]     |                     |
+----+------+------+------+------+------+----+----+ Wednesday 14 Oct    |
|    | Mon  | Tue  | Wed  | Thu  | Fri  |Sat |Sun | Classes             |
| [] +------+------+------+------+------+----+----+  09:00 to 10:30 ... |
| [] | 12   | 13   | (14) | 15   | 16   | 17 | 18 | Deadlines           |
| 3  | 09:00| 11:00| 09:00|      | Due  |    |    |  [ ] Quiz  CS 301   |
| [] | CS301| CS305| CS301|      | GE101|    |    | [Add a deadline...] |
+----+------+------+------+------+------+----+----+---------------------+
```

Phone (360px): the grid stays a real table with seven 44px columns. A filled square is a class, a ring is a deadline. The full text lives in the day panel directly underneath.

```
+--------------------------------+
| October 2026                   |
| [Previous][Today][Next]        |
+---+----+----+----+----+----+---+
|   |Mon |Tue |Wed |Thu |Fri |...|
|[] | 12 | 13 |(14)| 15 | 16 |   |
|3  | ■  | ■● | ■  |    | ●  |   |
+---+----+----+----+----+----+---+
| Wednesday 14 October 2026      |
| Classes                        |
|  09:00 to 10:30  CS 301 ...    |
| Deadlines                      |
|  [ ] Stacks and queues quiz    |
| [Add a deadline for 14 October]|
+--------------------------------+
```

## Principles

- Boldness is spent in one place: the week load gauge and the course tabs.
- Structure is information: borders and rules mean something; nothing is decorative except the faint grid.
- Motion only where it means something: the gauge fills when it appears or its level changes. `prefers-reduced-motion` turns it off.
- Words are design: sentence case, buttons say what happens ("Add a deadline for 14 October", "Delete course").
- Quality floor: works at 360px, visible keyboard focus everywhere, 44px targets on main actions, skip link, today marked by a filled circle (a shape) as well as a colour, and meaning never carried by colour alone (course code text, "overdue" text, load number).
