# NJD Siren

**njd-srien** is a siren built with [VueJS](https://vuejs.org/) and based on the [WebAudioAPI](https://www.w3.org/TR/webaudio/), it is famous in reggae and sound-system culture.

[Demonstration](https://siren.dubsounds.fr)

## Working

The principle is a a **main oscillator** that produces a wave. Beside, another oscillator that we call the **low frequency oscillator** (LFO) produces another wave. The oscillations of the LFO are modifying the frequency of the main oscillator, as a result, the amplitude of the main oscillations are changing, this is called **modulation**. The result is a siren that sounds like the cops, of the ambulance.

![LOF Explained](https://github.com/fallais/njd-siren/blob/master/assets/lfo_explained.gif)

## Usage

The siren is hosted [here](https://siren.dubsounds.fr).

You can play with multiple parameters :

- Speed
- Tone
- Wave form
- Volume

There is also a delay, based on [Tuna](https://github.com/Theodeus/tuna).