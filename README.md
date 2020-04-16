# NJD Siren

**njd-srien** is a siren built with [VueJS](https://vuejs.org/) and based on the [WebAudioAPI](https://www.w3.org/TR/webaudio/), it is famous in reggae and sound-system culture.

## Working

The principle is a a **main oscillator** that produces a wave. Beside, another oscillator that we call the **low frequency oscillator** (LFO) produces another wave. The oscillations of the LFO are modifying the wave of the main oscillator, this is called **modulation**. The result is a siren that sounds like the cops, of the ambulance.

![LOF Explained](https://github.com/fallais/njd-siren/blob/master/assets/lfo_explained.jpg)

## Usage

The siren is hosted here : https://siren.dubsounds.fr

You can play with multiple parameters :

- Speed
- Tone
- Wave form
- Volume

There is also a delay, based on [Tuna](https://github.com/Theodeus/tuna).