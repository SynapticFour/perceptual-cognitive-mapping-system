#!/usr/bin/env python3
"""Emit part1..part4.json for merge-cultural-adaptive-bank.py (200 items total)."""
from __future__ import annotations

import json
from pathlib import Path

HERE = Path(__file__).resolve().parent


def q(
    dim: str,
    n: int,
    rev: bool,
    tags: list[str],
    g: str,
    gh: str,
    wa: str,
) -> dict:
    return {
        "id": f"ca-v1-{dim}-{n:03d}",
        "dimension": dim,
        "reverse": rev,
        "tags": tags,
        "variants": {"global": g, "ghana": gh, "west_africa": wa},
    }


def write(name: str, rows: list[dict]) -> None:
    path = HERE / name
    path.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(path, len(rows))


def main() -> None:
    # --- sensory_regulation: 13 reverse false, 12 reverse true ---
    sr = "sensory_regulation"
    sensory: list[dict] = [
        q(sr, 1, False, ["sensory", "environment"], "I notice everyday smells in a room before others mention them.", "When I enter a room or hall, I often notice ordinary smells there before anyone else points them out.", "In the place where I sit or stand, I tend to notice common smells before people around me say anything."),
        q(sr, 2, False, ["sensory", "social"], "Busy crowded places drain my energy faster than calm places.", "When a place fills with many people and movement, I feel my energy drop sooner than in a calmer setting.", "In a packed market, vehicle, or gathering, I tire sooner than when the same task is done in a quiet spot."),
        q(sr, 3, False, ["sensory", "light"], "Bright overhead light starts to bother me if I stay under it a long time.", "If I remain under strong ceiling light for a long stretch, my eyes or head begin to feel strained.", "Under bright fixed lighting for many hours, I start to feel uneasy or worn down."),
        q(sr, 4, False, ["sensory", "auditory"], "When noise keeps rising, I move to a calmer spot if I can.", "If the sound level keeps climbing, I look for a quieter corner or step outside when that is possible.", "As noise builds around me, I shift toward a calmer area when there is a way to do it."),
        q(sr, 5, False, ["sensory", "touch"], "Rough seams or tags on clothing pull my attention away from what I am doing.", "Scratchy fabric edges or labels on my clothes distract me from the task in front of me.", "When cloth rubs roughly on my skin, I lose focus on what I meant to finish."),
        q(sr, 6, False, ["sensory", "temperature"], "I notice small shifts in heat or cold in a room before others comment.", "I feel slight changes in warmth or cool air in a space before someone else speaks about it.", "Temperature changes in the air around me reach my attention early compared with people nearby."),
        q(sr, 7, False, ["sensory", "auditory"], "Deep engine rumble or heavy machine vibration catches my attention quickly.", "Low shaking from engines or big machines pulls my attention as soon as it starts.", "Strong steady vibration from motors or equipment stands out to me right away."),
        q(sr, 8, False, ["sensory", "recovery"], "After someone shouts very close to me, I need a little time before I feel steady again.", "When a person raises their voice right beside me, I take a short while before I feel settled.", "Loud speech pressed near my ear leaves me needing a brief pause before I feel normal."),
        q(sr, 9, False, ["sensory", "observable"], "People can tell from my face or body when a place feels too loud for me.", "Others around me can see signs that the noise level is too much for me.", "My expression or posture shows when sound in a place is overwhelming me."),
        q(sr, 10, False, ["sensory", "recovery"], "After an overstimulating spell, I need a quiet break before I can focus well again.", "When a spell feels overstimulating, I recover focus faster if I get a quiet pause.", "I work best again only after some calm time following a very stimulating stretch."),
        q(sr, 11, False, ["sensory", "auditory"], "If music or a speaker is very loud, I turn it down or step away when I am allowed.", "When playback is far too loud, I lower the volume or leave the spot if that is acceptable.", "Very loud sound from a device or speaker leads me to reduce it or move off when I can."),
        q(sr, 12, False, ["sensory", "taste_texture"], "Food textures that are very slimy or very rough are hard to ignore while I eat.", "While eating, textures that are extremely slippery or coarse stay on my mind.", "Certain mouth-feels while chewing keep pulling my attention even if I want to think of something else."),
        q(sr, 13, False, ["sensory", "light"], "I choose a seat away from flashing or flickering lights when I have a choice.", "Given a choice, I sit where lights do not flicker or flash in my eyes.", "If seats are open, I pick one that avoids strobe-like or broken-bulb flicker."),
        q(sr, 14, True, ["sensory", "social"], "Crowded busy places feel about the same to my energy as quiet places.", "A full room and an empty room feel roughly equal in how much energy they take from me.", "Whether a place is packed or nearly empty barely changes how tired I feel."),
        q(sr, 15, True, ["sensory", "light"], "Strong overhead light rarely bothers me even after many hours.", "Ceiling lights can stay bright for a long time without me feeling strained.", "I can stay under bright fixed lights a long while without discomfort."),
        q(sr, 16, True, ["sensory", "auditory"], "Rising noise rarely makes me look for a different spot.", "Louder and louder sound around me seldom pushes me to relocate.", "I usually stay put even when the noise level climbs around me."),
        q(sr, 17, True, ["sensory", "touch"], "Rough clothing seams rarely distract me from my task.", "Tags and coarse seams on clothes seldom pull me off track.", "Fabric rubbing roughly hardly breaks my concentration."),
        q(sr, 18, True, ["sensory", "temperature"], "I rarely notice small heat or cold shifts unless someone points them out.", "Minor temperature changes in a room usually pass me by until another person mentions them.", "Slight warm or cool shifts in the air seldom reach my attention first."),
        q(sr, 19, True, ["sensory", "auditory"], "Engine rumble or machine vibration blends into the background for me.", "Heavy low vibration from equipment is easy for me to tune out.", "Motor rumble fades into the background without grabbing me."),
        q(sr, 20, True, ["sensory", "recovery"], "Loud speech near me rarely leaves me feeling off balance for more than a moment.", "A shout close by unsettles me only briefly, if at all.", "Sharp loud words beside me hardly ripple my calm."),
        q(sr, 21, True, ["sensory", "observable"], "Others rarely read discomfort on my face about the noise level.", "People seldom see from my look that sound is too much for me.", "My face does not often show that noise is overwhelming."),
        q(sr, 22, True, ["sensory", "recovery"], "I return to clear focus quickly right after a very stimulating stretch.", "Right after heavy stimulation, I snap back to focus without needing much pause.", "I do not need a long quiet gap before thinking clearly again after intensity."),
        q(sr, 23, True, ["sensory", "auditory"], "Very loud music or announcements rarely make me lower the volume or leave.", "Even when playback is extremely loud, I usually stay and accept it.", "Blaring sound seldom leads me to turn it down or walk away."),
        q(sr, 24, True, ["sensory", "taste_texture"], "Extreme slimy or rough food textures rarely bother me while eating.", "Unusual mouth-feel during meals seldom distracts me.", "Texture surprises in food hardly pull my mind away."),
        q(sr, 25, True, ["sensory", "light"], "Flickering or flashing lights rarely change where I choose to sit.", "Broken-bulb flicker or flashing signs seldom affect my seat choice.", "I pick seats without thinking about flicker risk."),
    ]

    af = "attention_focus"
    attention: list[dict] = [
        q(af, 1, False, ["attention", "focus"], "When I mean to finish one task, unrelated sounds often pull my mind away.", "While I am trying to finish one piece of work, background sounds often steal my thoughts.", "If I plan to stick to a single job, side noises still snatch my attention."),
        q(af, 2, False, ["attention", "switching"], "I jump between small tasks many times before the main one is done.", "I hop among minor jobs again and again before the big task reaches the end.", "Little side errands split my time before the chief task is closed."),
        q(af, 3, False, ["attention", "sustain"], "I can read or listen to instructions for a long stretch without losing the thread.", "I hold the line of a long explanation in my head while reading or listening.", "Long guidance stays clear in my mind while I take it in."),
        q(af, 4, False, ["attention", "detail"], "Small mistakes in a form or list jump out at me while I check it.", "When I scan a list or form, little errors show up to me quickly.", "Typos or missing lines catch my eye during review."),
        q(af, 5, False, ["attention", "distraction"], "A new message alert often interrupts me even when I planned to wait.", "Ping from a device often breaks my plan to stay off it for a while.", "Notifications cut in when I meant to stay focused elsewhere."),
        q(af, 6, False, ["attention", "sustain"], "I return to the same task after a short break and pick up where I left off.", "After stepping away briefly, I slide back into the same task smoothly.", "A pause does not erase my place in the work I was doing."),
        q(af, 7, False, ["attention", "dual"], "Doing two simple chores at once, like stirring and watching a pot, feels natural.", "Pairing two easy physical routines at the same time feels fine to me.", "Light dual tasks side by side do not confuse me."),
        q(af, 8, False, ["attention", "memory_cue"], "I rely on a written note or mark so I do not forget the next step.", "I leave myself a short written cue for the next action so it is not lost.", "A scrap of paper or phone note guards the next step in my mind."),
        q(af, 9, False, ["attention", "filter"], "Background chatter fades for me when I decide to lock onto one speaker.", "When I choose one voice to follow, other voices drop in importance in my ears.", "I can narrow listening to one person amid side talk."),
        q(af, 10, False, ["attention", "sustain"], "I lose track of time when I am deeply into a hands-on task I enjoy.", "Hours can pass unnoticed when I am absorbed in a satisfying manual task.", "A hands-on project I like can swallow my sense of clock time."),
        q(af, 11, False, ["attention", "switching"], "Switching tools mid-task costs me a moment to remember what comes next.", "Changing tools in the middle of a job creates a short blank in my sequence memory.", "Each tool swap needs a beat before the next move is clear."),
        q(af, 12, False, ["attention", "detail"], "I skim a page and miss a line that was clearly printed there.", "Quick reading makes me skip a printed line that was present.", "Fast scanning lets a visible line slip past me."),
        q(af, 13, True, ["attention", "focus"], "Unrelated sounds rarely pull me off a task I meant to finish.", "Side noise seldom steals me from a job I chose to complete.", "Background sound hardly breaks the task I locked onto."),
        q(af, 14, True, ["attention", "switching"], "I stay on one task until it is done before opening side tasks.", "I close the main job before I open smaller ones.", "Side errands wait until the chief task is finished."),
        q(af, 15, True, ["attention", "sustain"], "Long stretches of reading or listening often lose me halfway.", "Extended explanations often drift out of my grasp midway.", "Long guidance tends to blur before the end."),
        q(af, 16, True, ["attention", "detail"], "Small errors in a list are easy for me to miss on first pass.", "Little mistakes hide from me during a quick check.", "First scan of a form often leaves errors unseen."),
        q(af, 17, True, ["attention", "distraction"], "I can ignore new message alerts when I planned a focus block.", "Planned focus time usually holds even when the device pings.", "I keep alerts from breaking a focus block I set."),
        q(af, 18, True, ["attention", "sustain"], "After a break I often need to rebuild the whole picture of the task.", "Returning from pause, I rebuild the task picture slowly.", "Post-break restart feels like starting near the beginning."),
        q(af, 19, True, ["attention", "dual"], "Even two simple chores at once feel tangled for me.", "Pairing two easy routines at once confuses my hands or thoughts.", "Dual light tasks feel knotted rather than smooth."),
        q(af, 20, True, ["attention", "memory_cue"], "I remember the next step without needing a written cue most of the time.", "Next steps stay in mind without paper or phone reminders.", "I seldom need a note for what comes next."),
        q(af, 21, True, ["attention", "filter"], "Side chatter stays loud in my mind even when I try to focus on one speaker.", "Other voices stay prominent even when I pick one person to hear.", "Background talk keeps competing when I aim at one voice."),
        q(af, 22, True, ["attention", "sustain"], "I rarely lose track of clock time during hands-on work.", "Hands-on tasks keep my sense of passing hours steady.", "Clock awareness stays sharp even in absorbing manual work."),
        q(af, 23, True, ["attention", "switching"], "Switching tools mid-task feels seamless with almost no pause.", "Tool changes mid-job flow without a hitch.", "Moving from one implement to another is instant for me."),
        q(af, 24, True, ["attention", "detail"], "A careful read usually catches every printed line.", "Slow read picks up each line that is on the page.", "Line-by-line review rarely skips visible text."),
        q(af, 25, True, ["attention", "focus"], "I can keep mental focus on one topic through long waiting periods.", "Waiting a long time in a queue does not scatter my thoughts from the topic I chose.", "Long waits leave my chosen topic stable in mind."),
    ]

    write("part1.json", sensory + attention)

    # --- temporal_pacing + conversation_rhythm ---
    tp = "temporal_pacing"
    temporal: list[dict] = [
        q(tp, 1, False, ["time", "planning"], "When plans shift at short notice, I adjust what I do next without much fuss.", "If the time or place of a meeting changes late, I rearrange my next steps calmly.", "Sudden plan changes lead me to update my next moves without long upset."),
        q(tp, 2, False, ["time", "waiting"], "Long waits in a queue feel harder if I have nothing useful in hand to do.", "Standing in line for a long stretch drags more when my hands and mind are idle.", "Empty-handed waiting in a long line wears on me."),
        q(tp, 3, False, ["time", "punctuality_observable"], "I arrive within the window others expect when the time was agreed in advance.", "When a time was fixed ahead, I show up inside the range people expect.", "Agreed meeting times see me there in the expected span."),
        q(tp, 4, False, ["time", "flex"], "If a task takes longer than guessed, I extend the time I give it without panic.", "When work runs past the first guess, I widen the slot instead of rushing wildly.", "Underestimated duration gets more room rather than panic."),
        q(tp, 5, False, ["time", "rhythm"], "I break a big job into timed chunks with short rests in between.", "Large work gets split into blocks with brief rests between.", "Chunk-and-rest pacing is how I tackle long jobs."),
        q(tp, 6, False, ["time", "deadline"], "A clear deadline helps me finish rather than stalls me.", "Knowing the end time pushes me forward instead of freezing me.", "Fixed end dates spur completion rather than block starts."),
        q(tp, 7, False, ["time", "memory"], "I forget upcoming appointments unless I put them on a list or phone.", "Future times slip unless I record them on paper or device.", "Dates ahead vanish from mind without a written or digital reminder."),
        q(tp, 8, False, ["time", "transition"], "Switching from rest to work mode takes me several minutes.", "Moving from rest into active work needs a few minutes of ramp-up.", "Cold start from break to labor is not instant for me."),
        q(tp, 9, False, ["time", "social_time"], "Group work moves faster than I expected when everyone knows their part.", "Team tasks finish sooner than I thought when roles are clear.", "Clear division of labor speeds group jobs beyond my first guess."),
        q(tp, 10, False, ["time", "estimate"], "I underestimate how long travel will take when roads are busy.", "Busy routes make my travel guess too short.", "Traffic-heavy trips run longer than my first estimate."),
        q(tp, 11, False, ["time", "routine"], "Repeating the same morning steps in the same order settles me.", "Same order of morning actions steadies my start.", "Fixed morning sequence calms my entry into the day."),
        q(tp, 12, False, ["time", "flex"], "If someone arrives late, I use the gap for a small useful task.", "Late arrival by others becomes a slot for a tiny useful chore.", "Unexpected gaps become pockets for small wins."),
        q(tp, 13, True, ["time", "planning"], "Short-notice plan changes leave me rattled for a while.", "Late changes to time or place unsettle me before I can move on.", "Sudden shifts in schedule throw me off first, then I adapt."),
        q(tp, 14, True, ["time", "waiting"], "Long queues feel fine even with nothing in hand to occupy me.", "Waiting in line a long time without activity does not bother me.", "Idle long waits are easy on my mood."),
        q(tp, 15, True, ["time", "punctuality_observable"], "Agreed times are hard for me to hit even when I try.", "Expected arrival windows slip for me despite effort.", "People sometimes wait for me even when I intend to be prompt."),
        q(tp, 16, True, ["time", "flex"], "When a task runs long, I feel rushed rather than widening the slot.", "Past-guess duration makes me hurry instead of calmly extending time.", "Overrun tasks trigger rush feelings."),
        q(tp, 17, True, ["time", "rhythm"], "I prefer to push through a big job in one stretch without timed breaks.", "Large jobs feel better in one long push than in timed chunks.", "I avoid chunk timers on long work."),
        q(tp, 18, True, ["time", "deadline"], "A firm deadline makes me freeze or delay starting.", "End dates make starting harder rather than easier.", "Deadlines stall my opening move."),
        q(tp, 19, True, ["time", "memory"], "I keep upcoming times in mind without lists or phone reminders.", "Future appointments stay in memory without writing them down.", "I rarely miss a time I only heard spoken once."),
        q(tp, 20, True, ["time", "transition"], "I snap from rest to full work speed almost immediately.", "Break to labor shift happens in seconds.", "Rest ends and work speed peaks at once."),
        q(tp, 21, True, ["time", "social_time"], "Group work often runs longer than I first guessed.", "Team tasks drag past my opening estimate.", "Shared jobs expand in clock time versus my plan."),
        q(tp, 22, True, ["time", "estimate"], "I overguess travel time even when roads are clear.", "I pad travel time more than traffic needs.", "Clear roads still get a long time buffer from me."),
        q(tp, 23, True, ["time", "routine"], "Changing the order of morning steps does not unsettle me.", "Shuffled morning order leaves me fine.", "Morning sequence can vary without cost."),
        q(tp, 24, True, ["time", "flex"], "Late arrival by others frustrates me and I struggle to use the gap.", "When others are late, the open minutes feel wasted and irritating.", "Waiting on latecomers drains me without productive use."),
        q(tp, 25, True, ["time", "social_time"], "I expect solo tasks and group tasks to take about the same clock time.", "I budget equal minutes for alone work and shared work.", "Team versus solo duration feels similar in my planning."),
    ]

    cr = "conversation_rhythm"
    # Observable coordination of speaking turns and repair (not hierarchy or “correct” deference).
    conv: list[dict] = [
        q(cr, 1, False, ["social", "communication"], "In a group talk, I wait for a clear pause before I add my point.", "When many voices overlap, I hold my words until a calm opening appears.", "In overlapping speech, I wait for a settled gap before speaking."),
        q(cr, 2, True, ["social", "communication"], "I speak up as soon as I have something to add, even if others are still talking.", "If I have a thought, I offer it even while side talk continues.", "I insert my point when ready rather than waiting for full quiet."),
        q(cr, 3, False, ["social", "turn_taking"], "I yield the floor when someone else has been waiting with a raised hand.", "If another person has waited visibly, I pass the turn.", "Visible wait gets my silence so they can speak."),
        q(cr, 4, True, ["social", "turn_taking"], "I finish my full thought even if another person is ready to speak.", "I close my thought before yielding even when someone is poised.", "I complete my line before opening space."),
        q(cr, 5, False, ["social", "pace"], "I slow my speech when the other person looks confused.", "Confusion on the other face leads me to ease my pace.", "I stretch words slower when understanding seems low."),
        q(cr, 6, True, ["social", "pace"], "I keep the same speech speed even when the listener looks lost.", "Listener confusion does not change my talking speed much.", "My pace stays steady regardless of puzzled looks."),
        q(cr, 7, False, ["social", "clarity"], "I check whether the other person understood by asking a short question.", "I use a brief check question after giving instructions.", "After directions, I ask a tiny confirmation question."),
        q(cr, 8, True, ["social", "clarity"], "I move on after instructions without checking if they were clear.", "I leave instructions and assume all is clear unless someone stops me.", "I rarely ask a quick check after I explain steps."),
        q(cr, 9, False, ["social", "repair"], "If someone did not hear me, I repeat the same point in simpler shorter words.", "When my line was missed, I say it again shorter and plainer.", "Missed hearing gets a brief second version from me."),
        q(cr, 10, True, ["social", "repair"], "If someone did not hear me, I repeat the same long wording again.", "After a miss, I say the same long line a second time.", "My second try uses the same long phrasing as the first."),
        q(cr, 11, False, ["social", "nonverbal"], "I notice hand signals or nods that mean wait or go ahead.", "Small hand or head cues that mean pause or continue are visible to me.", "Silent turn cues read clearly for me."),
        q(cr, 12, True, ["social", "nonverbal"], "Small wait-or-go cues from hands or head often pass me by.", "Tiny silent cues about turn-taking slip past me.", "Hand and nod signals about pausing are easy to miss for me."),
        q(cr, 13, False, ["social", "listening"], "I can follow one quiet speaker even when side chatter continues.", "One low voice stays clear to me amid background talk.", "Soft main speaker plus side noise still works for my listening."),
        q(cr, 14, True, ["social", "listening"], "Side chatter makes one quiet speaker hard for me to track.", "Background talk drowns a soft main voice for me.", "Low lead voice plus chatter loses me."),
        q(cr, 15, False, ["social", "communication"], "I leave a short quiet gap so someone else can join.", "I leave a small open space in the talk so another person can enter.", "I pause briefly so another voice can enter the talk."),
        q(cr, 16, True, ["social", "communication"], "I jump in during short gaps before others have finished their line.", "I enter the gap early, before the other line feels fully closed.", "I start speaking in small openings even if the line may not be done."),
        q(cr, 17, False, ["social", "auditory"], "After a noisy spell, I repeat a key word slowly before I go on.", "When noise just dropped, I say a key word again, slowly, then continue.", "After loud noise, I restate one key word at a slower pace."),
        q(cr, 18, True, ["social", "auditory"], "After a noisy spell, I continue without repeating a key word.", "When noise ends, I move on without restating a key word.", "I do not restate a key word after the room was loud."),
        q(cr, 19, False, ["social", "communication"], "When several people speak at once, I lower my volume so one line can come through.", "If many voices clash, I soften my voice so one line can surface.", "During overlap, I speak more softly so one thread can win through."),
        q(cr, 20, True, ["social", "communication"], "When several people speak at once, I raise my volume so I am heard.", "If many voices clash, I push my voice louder to break through.", "During overlap, I speak up louder to cut through."),
        q(cr, 21, False, ["social", "observable"], "I point to what I mean when words alone might be unclear.", "If words might confuse, I point at the object or place I mean.", "I use a pointing gesture when plain words might miss."),
        q(cr, 22, True, ["social", "observable"], "I rely on words only even when pointing would make the meaning clearer.", "Even when a gesture would help, I stick to words alone.", "I avoid pointing even when it would clear things up."),
        q(cr, 23, False, ["social", "listening"], "I lose thread of a story if several people jump in without order.", "A tale told out of turn by many speakers confuses my tracking.", "Unordered jump-ins make me lose the narrative line."),
        q(cr, 24, True, ["social", "listening"], "Many unordered speakers do not confuse me; I rebuild the story.", "Jumping speakers still leave me with a clear story picture.", "Chaotic turn order does not lose me."),
        q(cr, 25, False, ["social", "observable"], "I step half a step back when someone steps forward to speak.", "If a person moves forward to speak, I make a small space with my feet.", "When someone advances to talk, I ease back a little."),
    ]

    write("part2.json", temporal + conv)

    sp = "structure_preference"
    # Observable planning, ordering, and environmental regularity (not obedience to authority).
    structure: list[dict] = [
        q(sp, 1, False, ["structure", "planning"], "I write numbered steps before starting a new multi-step chore.", "Fresh many-step tasks get a numbered list from me first.", "New complex chores start with ordered notes."),
        q(sp, 2, True, ["structure", "openness"], "I like open-ended days where tasks can reshuffle freely.", "Flexible days with reshuffle room feel better than rigid slots.", "Open schedules please me more than fixed minute maps."),
        q(sp, 3, False, ["structure", "rules"], "Clear written rules lower my stress in shared spaces.", "Posted plain rules calm me in shared work or living areas.", "Visible simple rules ease me in common spaces."),
        q(sp, 4, True, ["structure", "improv"], "If materials are missing, I improvise with what is nearby.", "Absent tools lead me to nearby substitutes.", "Gaps in supplies spark on-the-spot swaps."),
        q(sp, 5, False, ["structure", "planning"], "I pack bags the night before a morning trip.", "Evening-before packing is my habit for early travel.", "Morning trips get bags ready the prior night."),
        q(sp, 6, False, ["structure", "openness"], "Surprise visits feel disruptive when I had a fixed task list.", "Unplanned guests clash with a tight written list day.", "Pop-in visits jar me on list-heavy days."),
        q(sp, 7, False, ["structure", "environment"], "I reset objects to the same spots so I can find them again.", "Things return to fixed homes so search is short.", "Stable object homes speed finding."),
        q(sp, 8, False, ["structure", "rules"], "I question a rule that blocks safety or fairness even if it is written.", "Written rules that risk harm or unfairness get a spoken question from me.", "I raise concerns about bad posted rules."),
        q(sp, 9, False, ["structure", "sequence"], "Doing steps out of order on purpose feels uncomfortable if order matters for quality.", "Wrong order on purpose feels off when order affects outcome.", "Sequence jumps unsettle me when sequence affects results."),
        q(sp, 10, False, ["structure", "improv"], "I prefer a recipe or pattern the first time I try a new craft.", "First attempt at a craft wants a pattern in hand.", "New craft starts with a model to copy."),
        q(sp, 11, False, ["structure", "planning"], "I estimate time for each subtask before I begin.", "Subtask minutes get guessed before start.", "I slice total time across parts ahead of work."),
        q(sp, 12, True, ["structure", "openness"], "I enjoy discovering the path while moving rather than mapping everything first.", "Forward motion with partial map feels fun.", "Full pre-map is less fun than discover-as-I-go."),
        q(sp, 13, True, ["structure", "planning"], "I start multi-step chores without writing steps first.", "Many-step jobs begin straight from the head without lists.", "I launch complex tasks without numbered prep."),
        q(sp, 14, False, ["structure", "openness"], "Tight schedules with little reshuffle room feel better to me than loose days.", "Minute-tight plans beat fully open days for my comfort.", "I prefer heavy structure over floating tasks."),
        q(sp, 15, True, ["structure", "rules"], "Posted rules feel neutral or slightly stressful rather than calming.", "Wall rules neither calm nor excite me; slight stress.", "Written shared rules add little comfort."),
        q(sp, 16, False, ["structure", "improv"], "Missing materials stall me until the right tool appears.", "Without exact supplies I pause rather than swap.", "Wrong-tool work is hard to start."),
        q(sp, 17, True, ["structure", "planning"], "I pack on the morning of travel rather than the night before.", "Travel bags get packed at wake time.", "Same-day morning pack is my norm."),
        q(sp, 18, True, ["structure", "openness"], "Surprise visits feel welcome even on a fixed task day.", "Unplanned guests fit fine beside a list.", "Drop-in visitors sit well with planned chores."),
        q(sp, 19, True, ["structure", "environment"], "I leave tools where I last used them and search later.", "Objects rest where dropped until needed again.", "Floating placement is my habit."),
        q(sp, 20, False, ["structure", "environment"], "I keep the same tool layout between sessions so I can grab fast.", "Tools return to the same layout each time so my hand finds them fast.", "I reset my workspace layout the same way between sessions."),
        q(sp, 21, True, ["structure", "sequence"], "Order of steps rarely matters to me if the end result looks fine.", "End quality OK means order felt flexible to me.", "Step sequence is loose in my mind."),
        q(sp, 22, True, ["structure", "improv"], "I try a new craft first by experimenting without a pattern.", "Pattern-free first trial is my craft style.", "New making starts with free play."),
        q(sp, 23, True, ["structure", "planning"], "I begin work and discover time needs as I go.", "Clock needs reveal during the job.", "No upfront subtask time guesses."),
        q(sp, 24, False, ["structure", "openness"], "I want the full map before any first step.", "Complete preview before motion feels required.", "All-at-once planning precedes action."),
        q(sp, 25, True, ["structure", "environment"], "Shared tidy zones matter less to me than finishing the job.", "End finish beats mid-way neat placement for me.", "Completion tops strict tidiness."),
    ]

    ac = "adaptability_change"
    adapt: list[dict] = [
        q(ac, 1, False, ["adaptability", "change"], "When the method must change mid-task, I switch without long complaint.", "A required method swap mid-job gets a quick shift from me.", "Forced path change mid-task draws little grumble time."),
        q(ac, 2, False, ["adaptability", "novelty"], "Trying a new route to a familiar place feels refreshing.", "A different path to the same end feels like a treat.", "Unfamiliar roads to known places please me."),
        q(ac, 3, True, ["adaptability", "routine"], "I feel uneasy the first day a daily routine is interrupted.", "Day one of a broken routine feels off in my body.", "Routine break day one unsettles me."),
        q(ac, 4, False, ["adaptability", "problem_solving"], "If a tool breaks, I look for another object that can do the job.", "Tool failure sends me hunting for a stand-in object.", "Broken gear triggers substitute search."),
        q(ac, 5, True, ["adaptability", "social"], "New faces in a steady work group take me a meeting or two to adjust to.", "Fresh members in a fixed team need a couple meets from me.", "Steady crew changes need warm-up meets."),
        q(ac, 6, False, ["adaptability", "change"], "Weather shifts my outdoor plan and I rebuild the plan fast.", "Rain or wind reshapes outdoor work with quick replan.", "Sky change gets a fast alternate plan."),
        q(ac, 7, True, ["adaptability", "novelty"], "I revisit old habits even when a new habit would work better.", "Better new habit still loses to old groove sometimes.", "Comfort habit wins over improved new pattern at times."),
        q(ac, 8, True, ["adaptability", "instruction"], "I need the reason for a rule change before I accept the new rule.", "Rule swaps want a clear why from me.", "New rules need rationale to stick."),
        q(ac, 9, True, ["adaptability", "technology"], "Updated software layout slows me down until I explore every corner.", "Fresh app layout needs a full click tour before speed returns.", "UI redesign needs exploration time."),
        q(ac, 10, False, ["adaptability", "change"], "Canceled plans free me to do something else useful quickly.", "Plan drops become quick slots for other useful acts.", "Cancelation redirects me fast to next useful thing."),
        q(ac, 11, False, ["adaptability", "novelty"], "I sample unfamiliar food willingly when ingredients are named.", "Named parts make unknown dishes OK to taste.", "Ingredient labels open me to new plates."),
        q(ac, 12, False, ["adaptability", "routine"], "I return smoothly to a routine after a holiday break.", "Post-holiday rhythm snaps back for me.", "After time off, old daily pattern returns easily."),
        q(ac, 13, True, ["adaptability", "change"], "Method change mid-task frustrates me for a noticeable stretch.", "Mid-job method swap costs me mood time.", "Path change mid-task irritates before I move on."),
        q(ac, 14, True, ["adaptability", "novelty"], "A new route to a familiar place feels like unnecessary risk.", "Different roads to the same place feel risky not fun.", "Alternate paths feel needless."),
        q(ac, 15, False, ["adaptability", "routine"], "First interrupted routine day feels fine to me.", "Routine break day one feels normal.", "Day-one routine gap does not shake me."),
        q(ac, 16, True, ["adaptability", "problem_solving"], "Tool break stops the job until the exact tool is fixed or replaced.", "Without the right tool I halt rather than substitute.", "Exact-tool dependence on failure."),
        q(ac, 17, False, ["adaptability", "social"], "New people in a steady group feel instantly normal to me.", "Fresh faces slot in immediately for me.", "Instant comfort with new team members."),
        q(ac, 18, True, ["adaptability", "change"], "Weather change leaves me stuck without a new plan for a while.", "Sky shift freezes my planning for a bit.", "Weather turns create plan blanks."),
        q(ac, 19, False, ["adaptability", "novelty"], "I adopt a better new habit quickly when I see it works.", "Shown better habit swaps in fast for me.", "Evidence of improvement drives fast habit swap."),
        q(ac, 20, False, ["adaptability", "instruction"], "I accept a rule change on brief notice without needing a long reason.", "Short notice rule change sits fine without deep why.", "New rule on brief word works for me."),
        q(ac, 21, False, ["adaptability", "technology"], "Updated software feels intuitive right away.", "New layout clicks immediately.", "Redesign speeds me up from day one."),
        q(ac, 22, True, ["adaptability", "change"], "Canceled plans leave me drifting unsure what to do next.", "Dropped plans create empty unsure minutes.", "Cancelation empties my next move."),
        q(ac, 23, True, ["adaptability", "novelty"], "Unfamiliar food makes me refuse even when ingredients are named.", "Unknown dishes get a no even with parts listed.", "Named unfamiliar plates still get declined."),
        q(ac, 24, True, ["adaptability", "routine"], "After a long break, rebuilding routine takes many days.", "Holiday return stretches routine rebuild across days.", "Slow return to rhythm after time away."),
        q(ac, 25, False, ["adaptability", "problem_solving"], "I combine odd objects creatively when standard tools are gone.", "No standard tool sparks creative mashups from me.", "Odd combos finish jobs without proper gear."),
    ]

    write("part3.json", structure + adapt)

    er = "effort_recovery"
    effort: list[dict] = [
        q(er, 1, False, ["effort", "persistence"], "I return to a hard task after a short walk instead of abandoning it.", "Tough task plus brief walk brings me back to try again.", "Hard job gets another round after a stroll."),
        q(er, 2, False, ["effort", "recovery"], "Heavy physical work leads me to drink water and sit before the next chore.", "Big exertion gets water plus sit before round two.", "After hard labor I hydrate and rest briefly."),
        q(er, 3, False, ["effort", "persistence"], "I push to finish a boring but important task the same day I started.", "Dull-but-needed work closes same day it opens.", "Important boring jobs do not cross midnight idle."),
        q(er, 4, False, ["effort", "recovery"], "I notice muscle soreness and lighten the next task on purpose.", "Sore muscles trigger a lighter next load by choice.", "Body ache steers next task size down."),
        q(er, 5, False, ["effort", "mental"], "Mental fatigue makes me switch to a simple hands task for a while.", "Brain tired sends me to easy hand work awhile.", "Thinking drain moves me to plain manual chores."),
        q(er, 6, False, ["effort", "persistence"], "I split a huge cleaning job across several days on purpose.", "Massive cleaning spreads across planned days.", "Big clean gets day-sliced plan."),
        q(er, 7, False, ["effort", "recovery"], "I sleep longer after an unusually demanding day.", "Extra-hard day extends my sleep the night after.", "Big demand day lengthens next sleep."),
        q(er, 8, False, ["effort", "mental"], "I take notes during long talks so my mind can rest between points.", "Long speech gets note fragments so my mind breathes.", "Extended talk pairs with jotting breaks for me."),
        q(er, 9, False, ["effort", "persistence"], "I set a visible timer to work in focused bursts on dull tasks.", "Boring work runs in timed visible bursts.", "Timer chunks carry dull work."),
        q(er, 10, False, ["effort", "recovery"], "I stop work for food before I feel shaky.", "Meal breaks come before shaky hunger.", "Food pause precedes shakiness."),
        q(er, 11, False, ["effort", "persistence"], "I celebrate small finished pieces of a long project aloud or in text to someone.", "Tiny milestones get a spoken or text cheer to another person.", "Micro wins get shared praise."),
        q(er, 12, False, ["effort", "mental"], "After conflict talk, I need quiet alone time before the next social task.", "Hot words exchange needs solo quiet before next people task.", "Argument aftermath needs alone buffer."),
        q(er, 13, True, ["effort", "persistence"], "A hard failed attempt makes me shelve the task for days.", "Tough fail shelves the job many days.", "Failure sends long shelf time."),
        q(er, 14, True, ["effort", "recovery"], "I jump straight into the next heavy chore without water or sit.", "Back-to-back heavy chores without pause is my pattern.", "No sit or sip between hard rounds."),
        q(er, 15, True, ["effort", "persistence"], "Boring important tasks often spill to another day unfinished.", "Dull needed work crosses days open.", "Important drudge lingers unfinished."),
        q(er, 16, True, ["effort", "recovery"], "I ignore early muscle soreness and repeat the same heavy load.", "Early soreness ignored; same load repeated.", "Soreness does not shrink next task."),
        q(er, 17, True, ["effort", "mental"], "Mental fatigue makes me stop all work rather than switch task type.", "Brain tired halts everything.", "Think-tired ends the work block fully."),
        q(er, 18, True, ["effort", "persistence"], "I try to finish huge cleaning in one long push.", "Whole clean in one marathon session is my pull.", "One-shot giant clean attempts."),
        q(er, 19, True, ["effort", "recovery"], "Demanding day rarely changes how long I sleep.", "Hard day does not stretch night sleep.", "Sleep length stable after strain."),
        q(er, 20, True, ["effort", "mental"], "I rely on memory alone through long talks without jotting.", "Long talks need no notes from me.", "Memory holds long talks solo."),
        q(er, 21, True, ["effort", "persistence"], "Dull tasks run without timers until something interrupts.", "No burst timers on boring work.", "Open-ended grind on dull jobs."),
        q(er, 22, True, ["effort", "recovery"], "I work through hunger until shaking or headache appears.", "Hunger ignored until body signals hard.", "Food waits for strong body complaint."),
        q(er, 23, True, ["effort", "persistence"], "I move on to the next task without noting what I finished.", "Finished slices pass without acknowledgment.", "No micro-celebration between chunks."),
        q(er, 24, True, ["effort", "mental"], "After conflict talk I go straight into the next crowded task.", "Argument then immediate crowd task is fine for me.", "No solo buffer needed after tense talk."),
        q(er, 25, True, ["effort", "recovery"], "A few minutes with my eyes closed rarely changes how tired I feel.", "Short quiet with my eyes shut seldom shifts my tired level.", "A brief eye rest rarely lifts my energy."),
    ]

    le = "learning_expression"
    learn: list[dict] = [
        q(le, 1, False, ["learning", "demonstration"], "I understand a new physical skill faster when someone shows me once.", "Seeing a move once beats hearing many words for my body learning.", "Demo-first beats long verbal-only coaching for my hands."),
        q(le, 2, False, ["learning", "verbal"], "Spoken steps alone are enough for me to copy a simple new routine.", "Voice-only instructions carry simple new routines for me.", "Hearing the order is enough without pictures."),
        q(le, 3, False, ["learning", "practice"], "I repeat a new phrase aloud several times to lock it in.", "Fresh phrases get loud repeats to stick.", "New wording needs spoken loops."),
        q(le, 4, False, ["learning", "visual"], "I draw a quick map or diagram to explain where something is.", "Place explanation gets a fast sketch from me.", "Location questions get doodle answers."),
        q(le, 5, False, ["learning", "error"], "I learn from a mistake if the wrong outcome is shown clearly.", "Clear wrong result teaches me fast.", "Visible error outcome educates me."),
        q(le, 6, False, ["learning", "pace"], "I ask the teacher or guide to slow down when hands and words move too fast together.", "Hands plus words too fast triggers a slow request from me.", "I request slower combo demo when rushed."),
        q(le, 7, False, ["learning", "memory"], "I tie a new name to a face feature so I recall it next time.", "Face detail anchors new names for me.", "Feature hook holds names."),
        q(le, 8, False, ["learning", "expression"], "I use objects around me as props when telling a story.", "Storytelling grabs nearby objects as examples.", "Tales include prop pointing."),
        q(le, 9, False, ["learning", "reading"], "Long written instructions tire me; short bullet lists work better.", "Paragraph manuals drain me; bullets help.", "Wall-of-text rules lose me; lists win."),
        q(le, 10, False, ["learning", "practice"], "I practice a new dance or sport move in slow motion first.", "Fresh moves start in slow motion.", "New motor pattern begins slow."),
        q(le, 11, False, ["learning", "social"], "I learn a group game faster after one practice round than after only rules talk.", "One trial round beats rules lecture for group games.", "Play round teaches group rules faster for me."),
        q(le, 12, False, ["learning", "visual"], "Charts with colors help me compare amounts at a glance.", "Color bars make amount gaps obvious to my eyes.", "Hue-coded charts speed compare."),
        q(le, 13, True, ["learning", "demonstration"], "Watching once is not enough; I need several repeats before my body copies.", "Single demo is too thin; repeats needed for my body.", "Multi-repeat watch before motor copy."),
        q(le, 14, True, ["learning", "verbal"], "Spoken steps alone are not enough; I need a picture or gesture.", "Voice-only is thin; picture or hand cue needed.", "Words alone miss for new routines."),
        q(le, 15, True, ["learning", "practice"], "I lock new phrases silently in my head without saying them aloud.", "Silent mental loop stores new wording.", "No loud repeats needed for phrases."),
        q(le, 16, True, ["learning", "visual"], "I describe a place with words only and skip drawing.", "Word picture without sketch is my habit.", "No doodle for directions."),
        q(le, 17, True, ["learning", "error"], "Mistakes confuse me unless someone walks through the right steps slowly.", "Errors need slow correct walkthrough.", "Wrong tries need guided redo."),
        q(le, 18, True, ["learning", "pace"], "Fast hands with fast talk during demo feels fine to me.", "Rapid demo pace matches my learning.", "Speedy combo demo fits me."),
        q(le, 19, True, ["learning", "memory"], "I recall new names without linking them to face details.", "Names stick without feature tricks.", "Face hooks unused."),
        q(le, 20, True, ["learning", "expression"], "I tell stories with words only and rarely point to objects.", "Object-free storytelling is my style.", "Props seldom appear in my tales."),
        q(le, 21, True, ["learning", "reading"], "Long written instructions feel clearer than very short bullets.", "Full paragraphs beat ultra-short bullets for me.", "Dense text guides me well."),
        q(le, 22, True, ["learning", "practice"], "I practice new moves at full speed from the first try.", "Day-one new moves run full tempo.", "No slow-motion ramp."),
        q(le, 23, True, ["learning", "social"], "Rules talk alone is enough for me before a group game starts.", "Pre-game lecture carries me without practice round.", "Verbal rules pre-play suffice."),
        q(le, 24, True, ["learning", "visual"], "Color charts feel optional; numbers alone are enough.", "Numeric tables beat color bars for me.", "Plain numbers compare fine."),
        q(le, 25, True, ["learning", "demonstration"], "Written checklist beats live demo for my learning style.", "Paper checklist tops live show for me.", "List beats watching."),
    ]

    write("part4.json", effort + learn)

    total = len(sensory) + len(attention) + len(temporal) + len(conv) + len(structure) + len(adapt) + len(effort) + len(learn)
    if total != 200:
        raise SystemExit(f"expected 200, got {total}")


if __name__ == "__main__":
    main()
