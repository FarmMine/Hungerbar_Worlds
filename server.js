const FRAME_RATE = 5;
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
var {
    Server
} = require("socket.io");
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000"
    }
});
const {
    initGame,
    gameLoop,
    getUpdatedVelocity
} = require('./game');
const {
    makeid
} = require('./utils');
const {
    basePlayer
} = require('./playerBase');
const state = {};
const clientRooms = {};
const port = 3000;
const users = [{
        id: 1,
        username: "Admin",
        password: "Password",
        isAdmin: true
    },
    {
        id: 2,
        username: "User",
        password: "Password",
        isAdmin: false
    }
]
var playersNumberWithSockets = 0;
// user = users.find( ( user )=> user.username === username && user.password === password);
var sessions = [{
        id: 1,
        userId: 1
    },
    {
        id: 2,
        userId: 2
    }
]
const userInventory = [{
        userId: 1,
        isAdmin: true,
        inventory: {
            pos: {
                x: 1,
                y: 1
            },
            vel: {
                x: 0,
                y: 0
            },
            flying: false,
            itemList: {
                items: {
                    item1: {
                        A255000000100: {
                            x: 3,
                            y: 3
                        },
                        A255255000100: {
                            x: 4,
                            y: 3
                        }
                    },
                    item2: {
                        A255000000100: {
                            x: 4,
                            y: 2
                        }
                    },
                    item3: {
                        A255000000100: {
                            x: 4,
                            y: 4
                        }
                    },
                    foodItem: {
                        A255255000100: {
                            x: 4,
                            y: 1,
                            count: 1
                        }
                    }
                }
            }
        }
    },
    {
        userId: 2,
        isAdmin: false,
        inventory: {
            pos: {
                x: 5,
                y: 25
            },
            vel: {
                x: 0,
                y: 0
            },
            flying: false,
            itemList: {
                items: {
                    item1: {
                        A255000000100: {
                            x: 3,
                            y: 3
                        },
                        A255255000100: {
                            x: 4,
                            y: 3
                        }
                    },
                    item2: {
                        A255000000100: {
                            x: 4,
                            y: 2
                        }
                    },
                    item3: {
                        A255000000100: {
                            x: 4,
                            y: 4
                        }
                    },
                    foodItem: {
                        A255255000100: {
                            x: 4,
                            y: 1,
                            count: 1
                        }
                    }
                }
            }
        }
    }
]
Array.prototype.findById = function(value) {
    return this.findBy('id', parseInt(value))
}
Array.prototype.findBy = function(field, value) {
    return this.find(function(x) {
        return x[field] === value;
    })
}

app.use(express.static('frontend'))
app.get('/', (req, res) => {
    const range = req.range(30000)
    res.sendFile(__dirname + '/frontend/index.html');
});

var publicGame;


var badWords = new RegExp(/\b(5mmo|.bly|.cf|.ga|.gf|.gq|.ml|.tk|.ly|.ly|@rsehol|@unt|a-ss|a.rse|a.s.s|a55|a55hole|a_s_s|acrotomophilia|ahole|aids|ama10|anal|analsex|analprobe|anilingus|anul|anus|apeshit|ar5e|ar5h0le|ar5h0les|arrse|ars3|arse|arseh0le|arseh0les|arseho|arsehol|arsehole|arseholes|arsewipe|arsh0le|arshole|arsholes|as-s|ashole|ass|ass hole|ass-fucker|ass.|assbang|assbanged|assbangs|asses|assfuck|assfucker|assfukka|assh0le|assh0les|asshat|assho1e|asshole|assholecleaner|assholes|asskisser|asslick|asslicker|assmaster|assmunch|asswhole|asswipe|asswipes|autizmz|auto erotic|autoerotic|azz|b!tch|babeland|baby batter|ball gag|ball gravy|ball kicking|ball licking|ball sack|ball sucking|ballbag|balls|ballsack|banchoot|bang|bangbros|banger|bareback|barely legal|barenaked|barf|bastard|bastardo|bastards|basterd|bastinado|basyard|basyards|battyboy|bawdy|bdsm|beaner|beardedclam|beastial|beastiality|beatch|beater|beeeeutch|beefcurtains|beeyotch|beheading|belend|bellend|bellywhacker|beotch|bestial|bestiality|biatch|bich|biener|big black|big breasts|big knockers|big tits|bigtits|biitch|bimbo|bimbos|bindippers|birdlock|bit.|bitch|bitched|bitcher|bitchers|bitches|bitchin|bitching|bitchy|bitty|biyatch|black animals|black cock|black president|blacks|block me|blonde action|blonde on blonde action|bloody|blow|blow j|blow job|blow-job|blowher|blowhim|blowjob|blowjobs|blowme|blue waffle|blumpkin|bo11ocks|boabiesooking|boabysooking|boink|boiolas|boll0cks|bollock|bollocks|bollok|bollox|bolocks|bolox|bondage|boned|bonehead|boner|boners|bong|bonk|boob|boobies|boobs|booby|booger|boogers|bookie|booobs|boooobs|booooobs|booooooobs|bootee|bootha|boothas|bootie|booty|booty call|booze|boozer|boozy|bosedeeke|bosom|bosomy|bowels|breast|breasts|brown showers|browneye|browntown|brunette action|buceta|bucketcunt|bufu|bugger|bugger off|bukkake|bull shit|bulldager|bulldyke|bullet vibe|bullhell|bulls|bullshit|bullshits|bullshitted|bullturds|bum|bumbandit|bumhole|bung|bung hole|bunghole|bunny fucker|bunnyfucker|busty|butch|butt fuck|buttbreath|buttcheeks|buttface|buttfuck|buttfucker|butthair|butthead|butthole|buttholesweat|buttmuch|buttmunch|buttpicker|buttplug|c#nt|c-0-c-k|c-o-c-k|c-u-n-t|c0ck|c0cksucka|c0cksucker|c_u_n_t|cahnt|cahnts|cahone|callgirl|camel toe|cameltoe|camgirl|camslut|camwhore|candy-ass|carpet muncher|carpetmuncher|catshit|cawk|cervix|chav|cheesyass|chinc|chinchin|chincs|chink|chode|chodes|chowhai|chuffnuts|chutiya|cialis|circle jerk|circlejerk|cl1t|climax|clit|clitoff|cliton|clitoris|clitorus|clits|clitty|clover clamps|clunge|clusterfuck|cnut|cnuts|cocain|cocaine|cock|cock sucker|cock-sucker|cockblock|cockblocker|cockface|cockhead|cockholster|cockknocker|cockmunch|cockmuncher|cocks|cocksmoker|cocksuck|cocksucka|cocksucked|cocksucker|cocksuckers|cocksucking|cocksucks|cocksuka|cocksukka|coital|cojones|cok|cokmuncher|coksucka|com|commie|condom|cooch|coochie|coon|coons|cooter|coprolagnia|coprophilia|copulate|corksucker|cornhole|cornholed|cossorali|cracker|crackwhore|creampie|cretin|cripple|critest|crustycrotch|cuck|cucked|cuckhold|cuckold|cucks|cum|cummer|cummin|cumming|cumn|cumquat|cums|cumshot|cumshots|cumslut|cumstain|cun$|cunilingus|cunillingus|cunnilingus|cunny|cunt|cunt's|cunt.|cuntbreath|cuntdog|cuntface|cunthunter|cunting|cuntlick|cuntlicker|cuntlicking|cuntlip|cunton|cunts|cuntsucker|cuunt|cvnt|cvnts|cyalis|cyberfuc|cyberfuck|cyberfucked|cyberfucker|cyberfuckers|cyberfucking|d-ick|d-ong|d0ng|d0uch3|d0uche|d1ck|d1ck!|d1ckh@ed|d1ld0|d1ldo|dago|dagos|dammit|damn|damned|damnit|damnmit|darkie|darky|darnit|daterape|dawgie-style|dbqkd|dck|deeepthroat|deep throat|deepthroat|democratic socialism|dendrophilia|dick|dick-ish|dickbag|dickbrain|dickbreath|dickcheese|dickdipper|dickface|dickflipper|dickhead|dickheads|dickish|dickless|dickripper|dicks|dicksipper|dicksmack|dicksucker|dickweed|dickwhipper|dickwrinkle|dickzipper|diddle|diehd|dike|dildo|dildos|diligaf|dilldoe|dilldos|dillweed|dimwit|dingle|dink|dinks|dip shit|dip-shit|dipship|dipshit|dipstick|dirsa|dirty pillows|dirty sanchez|dlck|do-ong|dobber|dog style|dog-fucker|doggie style|doggie-style|doggiestyle|doggin|dogging|doggy style|doggy-style|doggystyle|dolcett|domination|dominatrix|dommes|dong|donkey punch|donkeypunch|donkeyribber|doofus|doosh|dopey|dork|double dong|double penetration|douch3|douche|douchebag|douchebags|douchejuice|douchenozzle|douchenugget|douchey|duche|dumass|dumbass|dumbasses|dumbbell|dumbfuck|dumbfucker|dumbo|dummy|dung|dxxkhead|dyke|dykes|eat my ass|ecchi|ecstasy|eff|effin|ejaculate|ejaculated|ejaculates|ejaculating|ejaculatings|ejaculation|ejakulate|enlargement|erect|erection|erotic|erotism|essohbee|ethical slut|ethnics|eunuch|extacy|extasy|f   u   c   k|f  u  c  k|f uck|f u ck|f u c k|f  u c k|f u c k e r|f u|f up|f###|f##k|f##king|f#cked|f'ck|f-----g|f---ed|f---ing|f--k|f-o-a-d|f-u-<-k|f-u-c-k|f-uck|f00k|f00ked|f0cker|f0oked|f4cker|f4g|f4nny|f<uk|f>>k|f@@@in|f@@@ing|f@ck|f@g|f@gs|f__kin|f__king|f_u_c_k|fack|fackin|facking|fag|fagg|fagg0t|fagged|fagget|fagging|faggit|faggits|faggitt|faggot|faggotass|faggotry|faggs|fagit|fagits|fagot|fagots|fags|faig|faigt|falcid|fanny|fannybandit|fannyflaps|fannyfucker|fanyy|fareskin|fartknocker|fatass|fatso|fbuddy|fck|fck1ng|fckeud|fckin|fcking|fcks|fckw1t|fckwit|fcuk|fcuked|fcuker|fcukin|fcuking|fcuks|feak|fecal|feck|fecker|feckin|fecking|feel the bern|feel the burn|feeling the burn|fekking|felch|felched|felcher|felching|fellate|felatio|fellatio|feltch|feltcher|feltching|female squirting|femdom|femsub|fggt|fgt|fick|figging|fingerbang|fingerfuck|fingerfucked|fingerfucker|fingerfuckers|fingerfucking|fingerfucks|fingering|fisted|fistfuck|fistfucked|fistfucker|fistfuckers|fistfucking|fistfuckings|fistfucks|fisting|fisty|fker|fkin|fking|flaccid|flacid|flamer|flammer|flange|fleshflute|floozy|fluck|flucknuts|fo0ked|foad|focker|foff|fondle|foobar|fook|fookd|fooked|fooker|fookin|fookin'|fooking|foot fetish|footjob|foreskin|freak|freex|frig|frigg|frigga|friggin|frigging|frigin|friging|fromhell|frotting|fu|fu&kin|fu&king|fu<k|fu<ked|fu<ker|fu<kin|fu<king|fu<kker|fu<kr|fu<ks|fu@k|fu@ker|fubar|fuck|fuck buttons|fuck shit motherfucker fucker fucking asshole|fuck-tard|fuck-wit|fucka|fuckass|fuckbah|fuckbuddy|fuckbutt|fucked|fucker|fuckers|fuckface|fuckhead|fuckheads|fuckin|fuckin'|fucking|fuckingbitch|fuckinghell|fuckings|fuckingshit|fuckingshitmotherfucker|fuckk|fuckme|fuckn|fucknugget|fucknut|fuckoff|fuckout|fucks|fucktard|fucktards|fucku|fuckup|fuckw1t|fuckwad|fuckwhit|fuckwit|fuckwits|fuckyou|fuct|fucw1t|fucwit|fudge packer|fudge-p@cker|fudge-packer|fudgep@cker|fudgepacker|fudgpacker|fuk|fukced|fuked|fuker|fukin|fuking|fukk|fukked|fukker|fukkin|fukking|fuks|fukwhit|fukwit|furbox|furburger|futanari|fuuck|fuukn|fuuuck|fuuuuck|fuuuuuck|fuuuuuuck|fux|fux0r|fvck|fvck-up|fvcking|fvckup|fvckw1t|fvckwit|fxck|f��ck|f��ck|f��cking|f����k|f��ck|f��ck|g-ay|g-spot|g@y|gae|gai|gang bang|gang-bang|gangbang|gangbanged|gangbangs|ganja|gash|gay|gayboy|gayhole|gaylord|gaysex|gazongers|genitals|gey|gfy|ghay|ghb|ghey|giant cock|gigolo|gilf|gimp|ginch|girl on|girl on top|girlie-gardening|girls gone wild|glans|glory hole|gloryhole|gnikcuf|goatcx|goatfucker|goatfuckers|goatse|god damn|god-dam|god-damned|godamn|godamnit|goddam|goddammit|goddamn|goddamned|goddamnit|goddamnwhore|gokkun|golden shower|goldenshower|gonad|gonads|goo girl|goodpoop|gook|gooks|goregasm|goris|gotdamn|gotdamnit|gringo|grope|group sex|gspot|gtfo|guido|guro|gutterslutbitchfromhell|gypo|gypos|gyppo|gyppos|h0m0|h0mo|h1tl3r|h1tler|hand job|handjob|hang|harami|hard core|hard on|hardcore|hardcoresex|hardon|he11|hebe|heeb|heil|hell|hemp|hentai|heroin|herp|herpes|herpy|heshe|hoar|hoare|hobag|hoe|hoer|hom0|homey|homoerotic|homoey|honger|honkers|honkey|honky|hooch|hookah|hooker|hoor|hootch|hootchie|hooter|hooters|hore|horniest|horny|hot chick|hotsex|how to kill|how to murder|hrny|http|https|huge fat|hump|humped|humping|hussy|hvns|hymen|idiot|iffy|inbred|incest|info wars|infowars|injun|intercourse|is nsfw|ities|j1zz|j3rk0ff|jack off|jack-off|jackass|jackhole|jackingoff|jacking off|jackoff|jail bait|jailbait|jap|japs|jasal|jerk|jerk off|jerk-off|jerk0ff|jerked|jerkoff|jew|jew!|jewed|jewish|jews|jigaboo|jiggaboo|jiggerboo|jism|jiz|jizm|jizz|jizzed|juggs|junglebunny|junkie|junky|k@ffir|k@ffirs|k@fir|k@firs|kaf1r|kaff1r|kaffir|kaffirs|kafir|kafirs|kafr|kants|kashit|kawk|keaster|khunt|kiddie-fiddler|kiddie-fiddling|kiddiefiddler|kiddiefiddling|kiddy-fiddler|kiddyfiddler|kike|kikes|kill|kinbaku|kinkster|kinky|klan|kn0b|knickers|knobber|knobbing|knobead|knobed|knobend|knobhead|knobjocky|knobjokey|kock|kondum|kondums|kooch|kooches|kootch|koran|kratom|kraut|kuffar|kum|kummer|kumming|kums|kunilingus|kunt|kuran|kyke|l3i+ch|l3itch|labia|lactate|lactoids|leather restraint|leather straight jacket|lech|lemon party|lemonparty|leper|lesbian|lesbo|lesbos|lesbyterian|lessy|levitra|lez|lezbian|lezbians|lezbo|lezbos|lezzie|lezzies|lezzo|lezzy|licker|lickmycunt|lies|lmao|lmfao|loin|loins|lolita|lousy hosts of|lovemaking|lube|lucifer|lust|lusting|lusty|lyin|lying ted|m-fucking|minge|motherf.ucker|m0f0|m0fo|m0nkey|m1nge|m45terbate|ma5terb8|ma5terbate|maderchood|make me come|male squirting|maledom|malesub|mams|man-root|marijuana|masochist|massa|master-bate|masterb8|masterbat|masterbat3|masterbate|masterbating|masterbation|masterbations|masturbate|masturbating|masturbation|meldom|menage a trois|menses|menstruate|menstruation|merde|meth|mick|mierda|milf|minge|missionary position|mo-fo|mof0|mofo|mofuccer|mofucker|mofuckers|mofucking|mofukcer|mohterfuccer|mohterfuccers|mohterfuck|mohterfucker|mohterfuckers|mohterfucking|mohterfucks|mohterfuk|mohterfukcer|mohterfukcers|mohterfuking|mohterfuks|molca|molest|molestation|monkey|monkey boi|monkey boy|moolie|moron|moterfuccer|moterfuck|moterfucker|moterfuckers|moterfucking|moterfucks|motha-fucka|mothafuccer|mothafuck|mothafucka|mothafuckas|mothafuckaz|mothafucked|mothafucker|mothafuckers|mothafuckin|mothafucking|mothafuckings|mothafucks|mother fucker|motherf---ers|motherfuccer|motherfuccers|motherfuck|motherfucka|motherfucked|motherfucker|motherfuckers|motherfuckin|motherfucking|motherfuckings|motherfuckka|motherfucks|motherfukkker|mound|mound of venus|mr hands|mthafucca|mthafuccas|mthafucka|mthafuckas|mthafukca|mthafukcas|mtherfucker|mthrfucker|mthrfucking|muff|muff diver|muff-diver|muff-diving|muffdiver|muffdiving|muffs|muth@fucker|mutha|muthafecker|muthafuccer|muthafuck|muthafuck@|muthafucka|muthafuckaz|muthafucker|muthafuckers|muthafucking|muthafuckker|muthafucks|muthafukas|muther|mutherfucker|mutherfucking|muthrfucking|n  i  g  g  e  r|n i g g e r|n  i  g  g  a|n i g g a|nigga|nlgger|n1gga|n1gger|n1gg3r|nads|naked|nambla|napalm|nappy|nawashi|negro|nestlecock|ni66ers|nig|nig nog|nig-nog|niga|nigg|nigg3r|nigg4h|nigga|niggah|niggas|niggaz|nigger|niggerlover|niggers|niggershit|niggle|niggs|niglet|nignog|nigs|nigz|nimphomania|nimrod|ninny|nipple|nipples|nob|nob jokey|nobhead|nobjocky|nobjokey|nonce|nooky|nude|nudity|numbnuts|nuse|nuthuggers|nutsack|nympho|nymphomania|o m f g|o m f g !|o m f g!|octopussy|omfg|omorashi|on9|onanism|one cup two girls|one guy one jar|one night stand|oneeyedbastard|onenightstand|opiate|opium|orgasmic|orgasms|orgies|orgy|ovary|ovum|ovums|piss-flaps|p00f|p00fs|p00fter|p00fters|p0of|p0rn|p@ki|p@kis|paddy|paedo|paedophile|paedophiles|pantie|panties|panty|pastie|pasty|pcp|peado|peadofile|peadofiles|pecker|peckerhead|pedo|pedobear|pedofile|pedophile|pedophilia|pedophiliac|peedo|peedofile|peedofiles|peedophile|peedophiles|peedos|pegging|pench0d|pench0ds|penchod|penchods|penetrate|penetration|penial|penile|penis|penisbreath|penisfucker|penishead|peniswrinkle|perversion|pervert|peyote|phalli|phallic|phanny|phanny.|pheck|phecking|phelching|pheque|phequing|phone sex|phonesex|phuck|phucker|phuckin|phucking|phucks|phuk|phuked|phuking|phukked|phukking|phuks|phuq|piece of shit|pigfucker|pighead|pikey|pillow-biter|pillowbiter|pimp|pimpis|pinko|piss|piss pig|piss-off|pissant|pissed|pissedoff|pisser|pissers|pisses|pissflaps|pissin|pissing|pissoff|pisspig|plastered|playboy|pleasure chest|pms|po0f|poff|polack|pole smoker|pollock|ponce|ponyplay|poof|poofs|poofter|poon|poonani|poontang|poop chute|poopchute|poostabber|poostabbers|porn|potty|pr!ck|pr!ck.|pr1ck|pr1ck!|pr1cks|pr1cks!|prejudice|prick|pricks|prig|prik|prince albert piercing|pron|prophit|prude|psytea|pthc|pube|pubes|pubic|pubic hair|pubis|punany|punkass|punky|puntang|puss|pusse|pussi|pussies|pussy|pussydick|pussylicker|pussylip|pussylips|pussypounder|pussys|pussywhip|pusy|puta|puto|puzzy|qhwl|queaf|queef|queero|queers|quefe|queve|quicky|quief|quim|quimsteak|qur'an|quran|qveer|r-tard|r@pe|racy|raghead|ragheads|raging boner|rally stream|rally streamming|rape|raped|raunch|reacharound|rectal|rectum|rectus|redtube|reefer|reetard|reich|ret@rd|retard|retarded|reverse cowgirl|revue|ricer|right side broadcast|rimadonna|rimjaw|rimjob|rimming|ritard|rootle|rosy palm|rosy palm and her 5 sisters|rsbn|rtard|rum|rump|rumprammer|rumpranger|ruski|rusty trombone|s&m|s-h-1-t|s-h-i-t|s-o-b|s0b|s1ut|s2x|s_h_i_t|sappho|scag|scantily|scat|schizo|schlong|schmeka|screwed|screwing|scroat|scrog|scrot|scrote|scrotum|scrud|scum|scum!|scumbag|scumber|seduce|sexo|sexpot|sexual|sh!+|sh!t|sh!te|sh!tes|sh1t|sh1te|shag|shagbucket|shagger|shaggin|shagging|shagstress|shamedame|shaved beaver|shaved pussy|sheister|shemale|shhit|shi+|shibari|shirtlifter|shirtlifters|shit|shitass|shitblimp|shitdick|shite|shiteater|shited|shitey|shitface|shitforbrains|shitfuck|shitfull|shithead|shithloe|shithole|shithouse|shiting|shitings|shits|shitstabber|shitstabbers|shitt|shitted|shitter|shitters|shitting|shittings|shitty|shiz|shlong|shmegma|shootingawad|shota|shrimping|shutup|side broadcasting|sissy|skag|skank|skaw|skeet|slackass|slanteye|sleaze|sleazy|sleeze|slut|slutdumper|slutkiss|sluts|slutty|sluttybitch|smagna|smeg|smegma|smut|smutty|snarf|snatch|snowballing|snuff|sodoff|sodom|sodomite|sodomize|sodomy|son-of-a-bitch|sonofabitch|sonofawhore|souse|soused|spac|spanking|spastic|spaz|spaz.|sperm|spic|spick|spik|spiks|spit-roast|spit-roasting|spitroast|spitroasting|splooge|splooge moose|spooge|spread legs|spunk|spunking|squaw|steamy|stfu|stiffy|stoned|strap on|strapon|strappado|strip club|strollop|strumpet|style doggy|sucker|suckes|sucking|suckmydick|suckster|suicide|sultry women|sumofabiatch|surah|swastika|swinger|tinyurl|twat|t0sser|t0ssers|t1t|t1tt1e5|t1tties|taint|tainted love|tard|taste my|tawdry|teabagged|teabagger|teabagging|teat|teets|terd|thats nsfw|that's nsfw|thug|tickedoff|tight white|tinkle|tit|titfuck|titi|tits|titt|tittie5|tittiefucker|titties|titty|tittyfuck|tittyfucker|tittysucker|tittywank|titwank|tity|tnuc|to55er|to55ers|toejam|toggaf|toke|tongue in a|toots|tosser|tossers|tossurs|towelhead|tprtm|trallop|tramp|tranny|trashy|tribadism|tribadist|trollop|trump train|tub girl|tubgirl|turd|tush|tushy|tvvat|tvvats|tw4t|tw@|tw@t|tw@ts|tw_t|twank|twat|twathead|twats|twatt|twattish|twatty|two girls one cup|twunt|twunter|twunts|typeform|tyt|undies|undressing|unwed|upskirt|upthebutt|upthegary|urethra play|urophilia|uterus|v14gra|v1gra|vag|vagina|valium|venus mound|verticaltaco|violet blue|violet wand|vixen|vorarephilia|voyeur|vp-rx|vprx|vulgar|vulva|w#nker|w#nkers|w00se|w0g|w0gs|w4nker!|w4nkers!|w@nk|w@nker|w@nkers|w@nks|wad|wang|wank|wank's|wanka|wanke$|wanked|wanker|wankers|wanking|wanks|wanky|warez|wazoo|weatback|wedgie|weenie|weewee|weebly|weiner|weirdo|wench|wet dream|wetback|wetspam|wh0re|wh0reface|whanker|whankers|white power|whitey|whiz|whoar|whoralicious|whore|whorealicious|whored|whoredog|whoreface|whorehopper|whorehouse|whores|whoring|wigger|willies|willy|wiseass|wizzer|wktkf|wkwl|wog|womb|women rapping|woody|wop|wordpress|wrapping men|wrinkled starfish|www|wwwhack|xnxx|xrse|xrseh|xrsehol|xrsehole|xxnx|xxxhole|y!ddo!|y!ddo!!|yadong|yaoi|yarichin|yariman|yeasty|yellow showers|yellowratbastard|yid|yido|yiffy|yobbo|zasal|zoophile|zoophilia)\b/, "igm");

function badWordFilter(msg) {
    return msg.replace(badWords, "***")
}


io.on('connection', socket => {
    socket.on('logIn', handleLogIn);
    socket.on('logOut', handleLogOut);
    socket.on('register', handleRegister);

    function handleRegister(params) {
        let username = badWordFilter(params.username)
        if ((username.includes("*"))) {
            return socket.emit("registerFailed", 'The username is offensive, try again without any bad words.')
        }
        if (!username || !params.password) {
            return socket.emit("registerFailed", 'One or all params are missing')
        }

        let user = users.findBy('username', username);
        if (user) {
            return socket.emit("registerFailed", 'Conflict: The user already exists.')
        }
        users.push({
            id: users.length + 1,
            username: username,
            password: params.password,
            isLoggedIn: true,
            isAdmin: false
        })
        user = users.findById(users.length);
        let newSession = {
            id: sessions.length + 1,
            userId: user.id
        }
        sessions.push(newSession)
        socket.emit("registerSuccessful", newSession.id)
    }

    function handleLogIn(params) {
        if (!params.username || !params.password) {
            return socket.emit("logInFailed", 'One or all params are missing')
        }
        const user = users.find((user) => user.username === params.username && user.password === params.password);
        if (!user) {
            return socket.emit("logInFailed", 'Unauthorized: username or password is incorrect')
        }
        if (user.isLoggedIn) {
            sessions = sessions.filter((session) => session.userId !== user.id);
        }
        let newSession = {
            id: sessions.length + 1,
            userId: user.id
        }
        sessions.push(newSession)
        socket.emit("logInSuccessful", newSession.id)
    }

    function handleLogOut(sessionId) {
        let session = sessions.findById(sessionId)
        if (session) {
            for (const user of users) {
                if (user.id === session.userId) {
                    user.isLoggedIn = false;
                    break;
                }
            }
        }
        sessions = sessions.filter((session) => session.id !== sessionId);
        socket.emit("logOutSuccessful")
    }
    socket.on('keypress', handle_keypress);
    socket.on('keydown', handle_keydown);
    socket.on('keyup', handle_keyup);
    socket.on('newGame', handleNewGame);
    socket.on('joinGame', handleJoinGame);
    socket.on('chat message', handleMessage);
    socket.on('joinPUBLIC', handlePublicGame);

    function handleJoinGame(roomName) {
        if (!roomName) {
            return;
        }
        if (roomName.length > 50) {
            return;
        }
        const room = io.sockets.adapter.rooms.get(roomName);
        let allUsers;
        if (room) {
            allUsers = io.sockets.adapter.rooms.get(roomName);
        }
        let numClients = 0;
        if (allUsers) {
            numClients = io.sockets.adapter.rooms.get(roomName).size;
        }

        if (numClients === 0) {
            socket.emit('unknownCode');
            return;
        } else if (numClients > 50) {
            socket.emit('tooManyPlayers');
            return;
        }
        clientRooms[socket.id] = roomName;
        socket.join(roomName);
        socket.number = numClients + 1;


        socket.emit('init', numClients + 1);
        if (!state[clientRooms[socket.id]].players[socket.number - 1]) {
            state[roomName].players[Object.keys(state[roomName].players).length] = basePlayer(playersNumberWithSockets);
        };
    }

    function handleNewGame() {
        let roomName = makeid(5);
        clientRooms[socket.id] = roomName;
        socket.emit('gameCode', roomName);

        state[roomName] = initGame();

        socket.join(roomName);
        socket.number = 1;
        socket.emit('init', 1);
        state[roomName].players[Object.keys(state[roomName].players).length] = basePlayer(playersNumberWithSockets);
        startGameInterval(roomName);
    }

    function handlePublicGame(roomName) {
        if (!roomName) {
            return;
        }
        if (!publicGame) {
            let roomName = "PUBLIC";
            clientRooms[socket.id] = roomName;
            socket.emit('gameCode', roomName);
            state[roomName] = initGame();
            socket.join(roomName);
            socket.number = 1;
            socket.emit('init', 1);
            state[roomName].players[Object.keys(state[roomName].players).length] = basePlayer(playersNumberWithSockets);
            startGameInterval(roomName);
            publicGame = true;
        } else if (publicGame) {
            handleJoinGame(roomName)
        }
    }

    function handleMessage(msg) {
        if (msg.length > 150) {
            return;
        }
        const roomName = clientRooms[socket.id];
        if (!roomName) {
            return;
        }
        if (msg === "EASTER EGG") {
            socket.emit('image', 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAA6klEQVQY02MsNPv/gI9B4RPDAz4Gxj0M/12gJAQwPeBjePyu8QEfw4svrf9dGO4+r/nvwnDtfhkDA8OhkymMEN3I+pBJpgd8UB2MexjOSOYx7mE4yJsCJxmCGP6rK5cGMfyXk8wNdPkvzJsc6PKfnVWVm92cm92cAVNOmDdZkM8UwmYw11sjKRqJLBfo8p+NRY6dVZWdVZWRj9tQU7n65t2lzExCDDDw5cchFiYhBgYGJgE+vWu3p6srR//9987OfM7ff+9+/XkAUcTF+4ORjUWOkZH9//+fjIzsLExC//5/Y2Bg+Pf/B0QFALd/ZN1Oc9vtAAAAAElFTkSuQmCC');
            //reader.onload = function () {
            //    const base64 = this.result.replace(/.*base64,/, '');
            //   img.src = "./BlueBerryBlock.png";
            //   socket.emit('image', img.toString('base64'));
            //};

        }
        msg = badWordFilter(msg)
        socket.to(roomName).emit('chat message', msg);
    }
    /*
    Movement rules
    1. Vel X
    At start keydown, keyup, keypress are always true for vel x and then keydown only works if vel is 0, keyup only works if it is 1,-1 or 0 and keypress only works if it is between -1 and 1 SO
    Vel x never goes over Vel 1 or -1 with a key.

    2. Vel Y
    Same as X
    */
    function handle_keydown(keyCode) {
        const roomName = clientRooms[socket.id];
        if (!roomName) {
            return;
        }
        try {
            keyCode = parseInt(keyCode);
        } catch (e) {
            console.error(e);
            return;
        }
        const vel = getUpdatedVelocity(keyCode);
        if (vel) {
            // If they have x vel of 0 then add to x
            if (state[roomName].players[socket.number - 1].vel.x <= 0 && state[roomName].players[socket.number - 1].vel.x >= 0) {
                state[roomName].players[socket.number - 1].vel.x += vel.x;
            }
            if (state[roomName].players[socket.number - 1].vel.y <= 0 && state[roomName].players[socket.number - 1].vel.y >= 0) {
                state[roomName].players[socket.number - 1].vel.y += vel.y;
            }
        }
    }

    function handle_keyup(keyCode) {
        const roomName = clientRooms[socket.id];
        if (!roomName) {
            return;
        }
        try {
            keyCode = parseInt(keyCode);
        } catch (e) {
            console.error(e);
            return;
        }
        const vel = getUpdatedVelocity(keyCode);
        if (vel) {
            // If they have x vel of 1 or -1 or 0 then add to x
            if (state[roomName].players[socket.number - 1].vel.x <= 1 && state[roomName].players[socket.number - 1].vel.x >= -1) {
                state[roomName].players[socket.number - 1].vel.x += vel.x;
            }
            if (state[roomName].players[socket.number - 1].vel.y <= 1 && state[roomName].players[socket.number - 1].vel.y >= -1) {
                state[roomName].players[socket.number - 1].vel.y += vel.y;
            }
        }
    }

    function handle_keypress(keyCode) {
        const roomName = clientRooms[socket.id];
        if (!roomName) {
            return;
        }
        try {
            keyCode = parseInt(keyCode);
        } catch (e) {
            console.error(e);
            return;
        }
        const vel = getUpdatedVelocity(keyCode);

        if (vel) {
            try {
                // If they have x vel of -1 to 1 then add to x
                if (state[roomName].players[socket.number - 1].vel.x <= 10 && state[roomName].players[socket.number - 1].vel.x >= -10) {
                    state[roomName].players[socket.number - 1].vel.x += vel.x;
                }
                if (state[roomName].players[socket.number - 1].vel.y <= 10 && state[roomName].players[socket.number - 1].vel.y >= -10) {
                    state[roomName].players[socket.number - 1].vel.y += vel.y;
                }
                //if (state[roomName].players[socket.number - 1].vel.y == 0 && (state[roomName].players[socket.number - 1].flying === false)) { state[roomName].players[socket.number - 1].vel.y += vel.y; state[roomName].players[socket.number - 1].flying = true;}
            } catch (e) {
                return;
            }
        }
    }
});

function startGameInterval(roomName) {
    const intervalId = setInterval(() => {
        const winner = gameLoop(state[roomName]);

        if (!winner) {
            emitGameState(roomName, state[roomName])
        } else {
            if (roomName === "PUBLIC") {
                publicGame = false;
                return;
            }
            emitGameOver(roomName, winner);
            state[roomName] = null;
            clearInterval(intervalId);
        }
    }, 1000 / FRAME_RATE);
}

function emitGameState(room, gameState) {
    // Send this event to everyone in the room.
    io.sockets.in(room)
        .emit('gameState', JSON.stringify(gameState));
}

function emitGameOver(room, winner) {
    io.sockets.in(room)
        .emit('gameOver', JSON.stringify({
            winner
        }));
}

//io.listen(3000 || process.env.PORT);
server.listen(port, () => {
    // console.log('listening on *:' + port);
});