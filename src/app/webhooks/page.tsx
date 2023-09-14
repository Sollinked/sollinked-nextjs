'use client';
import { ChangeEvent, useCallback, useMemo, useEffect, useState } from 'react';
import { Webhook } from './types';
import { toast } from 'react-toastify';
import { cloneObj } from '../../common/utils';
import { useSollinked } from '@sollinked/sdk';

const Page = () => {
    const [ webhooks, setWebhooks ] = useState<{
		discord: Webhook,
		custom: Webhook,
	} | undefined>();
	const [isSaving, setIsSaving] = useState(false);
	const [isTesting, setIsTesting] = useState(false);
    const { user, integration } = useSollinked();

	useEffect(() => {
		if(!user.webhooks) {
			return;
		}
		setWebhooks({
			discord: user.webhooks.filter(x => x.type === "discord")[0],
			custom: user.webhooks.filter(x => x.type === "custom")[0],
		});
	}, [user]);

    const onSave = useCallback(async() => {
		if(!webhooks) {
            return;
		}

        if(!integration) {
            return;
        }

		if(!webhooks.custom.value && !webhooks.discord.value) {
			toast.error('Please insert webhooks value');
			return;
		}

		if(!webhooks.custom.template && !webhooks.discord.template) {
			toast.error('Please insert webhooks template');
			return;
		}

		setIsSaving(true);
        try {
			for(const [key, value] of Object.entries(webhooks)) {
				if(!value.value || !value.template) {
					continue;
				}
				await integration.update(value.id, {
					value: value.value,
					template: value.template,
				});

			}
            toast.success("Saved");
        }

        catch {
            toast.error('Unable to save data');
        }
		setIsSaving(false);
    }, [ webhooks, integration ]);

    const onTest = useCallback(async() => {
        if(!webhooks) {
            return;
        }

        if(!integration) {
            return;
        }

		setIsTesting(true);
        try {
            await integration.test(webhooks.discord.id);
            await integration.test(webhooks.custom.id);
            toast.success("Command sent!");
        }

        catch {
            toast.error("Error reaching webhooks");
        }
		setIsTesting(false);
    }, [ webhooks, integration ]);

    const onValueChanged = useCallback((e: ChangeEvent<HTMLInputElement>, type: "discord" | "custom") => {
        let cloned = cloneObj(webhooks);
        if(!cloned) {
            return;
        }
        cloned[type].value = e.target.value;
        setWebhooks(cloned);
    }, [webhooks]);

    const onTemplateChanged = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        let cloned = cloneObj(webhooks);
        if(!cloned) {
            return;
        }
        cloned.discord.template = e.target.value;
        cloned.custom.template = e.target.value;
        setWebhooks(cloned);
    }, [webhooks]);

    return (
        <div 
			className={`
				flex flex-col p-3
				bg-slate-700 rounded
				text-slate-300
				md:text-xs
			`}
		>
			<span>By setting up integration, you will be notified of every payment that you receive.</span>
			<span
				className={`
					mt-8
				`}
			>To integrate, follow these steps:</span>
			<ul
				className={`
					ml-5 mt-3
					list-decimal text-sm
				`}
			>
				<li>Right Click your Discord Server</li>
				<li>Select Server Settings {'>'} Integrations</li>
				<li>Create Webhook</li>
				<li>Copy Webhook URL and paste it here</li>
				<li>Save!</li>
			</ul>
			<strong className='mt-8 mb-1'>Discord Webhook URL</strong>
			<input 
				className={`
					bg-slate-800 rounded
					px-3 py-2
				`} 
				type="text" 
				placeholder='https://discord.com/api/webhooks/...' 
				onChange={(e) => onValueChanged(e, "discord")} 
				value={webhooks?.discord.value ?? ""}
			/>
			<strong className='mt-5 mb-1'>Custom Webhook URL</strong>
			<input 
				className={`
					bg-slate-800 rounded
					px-3 py-2
				`} 
				type="text" 
				placeholder='https://your.webhooks' 
				onChange={(e) => onValueChanged(e, "custom")} 
				value={webhooks?.custom.value ?? ""}
			/>
			<strong className='mt-5 mb-1'>Notification Template</strong>
			<input 
				className={`
					bg-slate-800 rounded
					px-3 py-2
				`} 
		 		type="text" 
				placeholder='Received {{amount}} from {{payer}}' 
				onChange={onTemplateChanged} 
				value={webhooks?.discord.template ?? ""} // discord and custom has same template
			/>
			<span className='text-xs mt-1'>{'{{amount}} and {{payer}} will be replaced with actual amount and payer'}</span>
			<div className={`mt-8`}>
				<button 
					className={`
						w-[200px] py-2
						border-[1px] border-green-800
						bg-green-500 rounded text-white
					`} 
					onClick={onSave}
				>
					{isSaving? 'Saving..' : 'Save'}
				</button>
				<button 
					className={`
						w-[200px] py-2
						border-[1px] border-yellow-800
						bg-yellow-500 rounded text-white
						ml-5
					`} 
					onClick={onTest}
				>
					{isTesting? 'Testing..' : 'Test'}
				</button>
			</div>
        </div>
    );
}

export default Page;