[
    h => { h.affirmativeSentences = ["sí", "si", "ok", "está bien", "chévere", "vale"]; h.next(); },
    h => { h.showImage("medios/anonymous.jpg"); h.next(); },
    h => { h.show("Anónimo: Hola, soy Anónimo. ¿Me ayudas a detener a los malvados?"); h.wait(1000) },
    h => { h.show("Anónimo: Aguarda mis instrucciones..."); h.wait(500); },
    h => { h.show("Anónimo: Si deseas continuar debes tomar el control de este terminal"); h.wait(500) },
    h => { h.show("Anónimo: para lograr eso escribe el siguiente comando:<code>terminal take hack</code> y pulsa ENTER. Luego escribe <code>./next</code> para avanzar a la siguiente instrucción.") },
    h => { h.show("Anónimo: ¡Qué bueno verte de nuevo!"); h.wait(1000); },
    h => { h.show("Anónimo: Antes de continuar debes estar en cuenta de algo"); h.wait(1000); },
    h => { h.show("Anónimo: Esto es muy peligroso. Mucha gente depende de ti."); h.wait(1000); },
    h => { h.show("Anónimo: ¿Entiende esto? Sí lo entiendes escribe 'si' y pulsa ENTER") },
    h => { if (h.affirmativeSentences.includes(h.userInput.toLowerCase())) { h.show("Anónimo: ¿me quieres ayudar?") } else { h.show("adios...") }; },
    h => { if (h.affirmativeSentences.includes(h.userInput.toLowerCase())) { h.show("Anónimo: Vale, continuamos"); h.wait(1000); } else { h.show("adios...") }; },
    h => { h.show("Anónimo: Debemos meternos en la red del malo para saber que se trae entre manos"); h.wait(1000); },
    h => { h.show("Anónimo: con el comando <code>remote net connect x.x.x.x</code> podemos conectarnos"); h.userInput = undefined; h.wait(1000); },
    h => { h.show("Anónimo: Hace falta tener los códigos x.x.x.x que son 4 numeros de la dirección IP"); h.wait(1000); },
    h => { h.show("Anónimo: Los estoy buscando... Mientras tanto escribe el comando y espera"); h.wait(3000); },
    h => { h.show("Anónimo: Ya creo que lo tengo."); h.wait(3000); },
    h => { h.show("Anónimo: ¡Ajá! Las 4 x son: 9.9.9.1"); h.wait(3000); },
]



