<script lang="ts">
	import QRCode from 'qrcode';
	import {
		buildQrBillPayload,
		formatReference,
		isValidIBAN,
		qrReference,
		type QrBill
	} from '$lib/billing/qrbill';

	let iban = $state('CH93 0076 2011 6238 5295 7');
	let creditorName = $state('Pfadi Musterlager');
	let amount = $state(60);
	let referenceRaw = $state('313947143000901');
	let message = $state('Lager-Abo 2026');

	const bill = $derived.by<QrBill>(() => ({
		iban,
		creditor: {
			name: creditorName,
			street: 'Postgasse',
			buildingNumber: '1',
			postalCode: '3000',
			town: 'Bern',
			country: 'CH'
		},
		amount,
		currency: 'CHF',
		referenceType: 'QRR',
		reference: referenceRaw
	}));

	const payloadOrError = $derived.by(() => {
		try {
			return {
				payload: buildQrBillPayload(bill),
				reference: qrReference(referenceRaw),
				error: null
			};
		} catch (e) {
			return { payload: null, reference: null, error: (e as Error).message };
		}
	});

	let svg = $state('');
	$effect(() => {
		const p = payloadOrError.payload;
		if (!p) {
			svg = '';
			return;
		}
		QRCode.toString(p, { type: 'svg', errorCorrectionLevel: 'M', margin: 1 })
			.then((s) => (svg = s))
			.catch(() => (svg = ''));
	});
</script>

<svelte:head><title>QR-Rechnung – Lagerküchen-Planer</title></svelte:head>

<div class="mx-auto max-w-3xl px-4 py-10">
	<h1 class="text-2xl font-bold text-gray-900">QR-Rechnung</h1>
	<p class="mt-1 text-gray-600">
		Schweizer QR-Rechnung als Alternative zu Stripe/TWINT. Die Felder erzeugen live den
		QR-Code-Inhalt nach Swiss-QR-Bill-Spezifikation.
	</p>

	<div class="mt-6 grid gap-6 md:grid-cols-2">
		<div class="space-y-3">
			<label class="block text-sm"
				>IBAN / QR-IBAN
				<input class="mt-0.5 w-full rounded border-gray-300" bind:value={iban} />
				{#if !isValidIBAN(iban)}<span class="text-xs text-red-600">Ungültige IBAN</span>{/if}
			</label>
			<label class="block text-sm"
				>Zahlungsempfänger
				<input class="mt-0.5 w-full rounded border-gray-300" bind:value={creditorName} />
			</label>
			<label class="block text-sm"
				>Betrag CHF
				<input
					type="number"
					min="0"
					step="0.05"
					class="mt-0.5 w-full rounded border-gray-300"
					bind:value={amount}
				/>
			</label>
			<label class="block text-sm"
				>Referenz (Ziffern)
				<input class="mt-0.5 w-full rounded border-gray-300" bind:value={referenceRaw} />
				{#if payloadOrError.reference}
					<span class="text-xs text-gray-500">QRR: {formatReference(payloadOrError.reference)}</span
					>
				{/if}
			</label>
			<label class="block text-sm"
				>Mitteilung
				<input class="mt-0.5 w-full rounded border-gray-300" bind:value={message} />
			</label>
		</div>

		<div class="flex flex-col items-center justify-start">
			{#if payloadOrError.error}
				<p class="text-sm text-red-600">{payloadOrError.error}</p>
			{:else if svg}
				<div class="w-56 [&>svg]:h-full [&>svg]:w-full">{@html svg}</div>
				<p class="mt-2 text-center text-xs text-gray-500">
					Empfänger {creditorName} · CHF {amount.toFixed(2)}
				</p>
			{/if}
		</div>
	</div>

	<p class="mt-8 text-xs text-gray-400">
		Hinweis: Dies rendert den QR-Bill-Datenstring. Für einen amtlich konformen Einzahlungsschein
		fehlen noch das Schweizerkreuz-Overlay und das A6-Zahlteil-Layout – ein Feinschliff für später.
	</p>
</div>
