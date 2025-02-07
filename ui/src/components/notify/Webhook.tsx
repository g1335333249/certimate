import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { getErrMessage } from "@/lib/error";
import { isValidURL } from "@/lib/url";
import { NotifyChannels, NotifyChannelWebhook } from "@/domain/settings";
import { update } from "@/repository/settings";
import { useNotify } from "@/providers/notify";
import { notifyTest } from "@/api/notify";
import Show from "@/components/Show";

type WebhookSetting = {
  id: string;
  name: string;
  data: NotifyChannelWebhook;
};

const Webhook = () => {
  const { config, setChannels } = useNotify();
  const { t } = useTranslation();
  const [changed, setChanged] = useState<boolean>(false);

  const [webhook, setWebhook] = useState<WebhookSetting>({
    id: config.id ?? "",
    name: "notifyChannels",
    data: {
      url: "",
      enabled: false,
    },
  });

  const [originWebhook, setOriginWebhook] = useState<WebhookSetting>({
    id: config.id ?? "",
    name: "notifyChannels",
    data: {
      url: "",
      enabled: false,
    },
  });

  useEffect(() => {
    setChanged(false);
  }, [config]);

  useEffect(() => {
    const data = getDetailWebhook();
    setOriginWebhook({
      id: config.id ?? "",
      name: "webhook",
      data,
    });
  }, [config]);

  useEffect(() => {
    const data = getDetailWebhook();
    setWebhook({
      id: config.id ?? "",
      name: "webhook",
      data,
    });
  }, [config]);

  const { toast } = useToast();

  const checkChanged = (data: NotifyChannelWebhook) => {
    if (data.url !== originWebhook.data.url) {
      setChanged(true);
    } else {
      setChanged(false);
    }
  };

  const getDetailWebhook = () => {
    const df: NotifyChannelWebhook = {
      url: "",
      enabled: false,
    };
    if (!config.content) {
      return df;
    }
    const chanels = config.content as NotifyChannels;
    if (!chanels.webhook) {
      return df;
    }

    return chanels.webhook as NotifyChannelWebhook;
  };

  const handleSaveClick = async () => {
    try {
      webhook.data.url = webhook.data.url.trim();
      if (!isValidURL(webhook.data.url)) {
        toast({
          title: t("common.save.failed.message"),
          description: t("settings.notification.url.errmsg.invalid"),
          variant: "destructive",
        });
        return;
      }

      const resp = await update({
        ...config,
        name: "notifyChannels",
        content: {
          ...config.content,
          webhook: {
            ...webhook.data,
          },
        },
      });

      setChannels(resp);
      toast({
        title: t("common.save.succeeded.message"),
        description: t("settings.notification.config.saved.message"),
      });
    } catch (e) {
      const msg = getErrMessage(e);

      toast({
        title: t("common.save.failed.message"),
        description: `${t("settings.notification.config.failed.message")}: ${msg}`,
        variant: "destructive",
      });
    }
  };

  const handlePushTestClick = async () => {
    try {
      await notifyTest("webhook");

      toast({
        title: t("settings.notification.config.push.test.message.success.message"),
        description: t("settings.notification.config.push.test.message.success.message"),
      });
    } catch (e) {
      const msg = getErrMessage(e);

      toast({
        title: t("settings.notification.config.push.test.message.failed.message"),
        description: `${t("settings.notification.config.push.test.message.failed.message")}: ${msg}`,
        variant: "destructive",
      });
    }
  };

  const handleSwitchChange = async () => {
    const newData = {
      ...webhook,
      data: {
        ...webhook.data,
        enabled: !webhook.data.enabled,
      },
    };
    setWebhook(newData);

    try {
      const resp = await update({
        ...config,
        name: "notifyChannels",
        content: {
          ...config.content,
          webhook: {
            ...newData.data,
          },
        },
      });

      setChannels(resp);
    } catch (e) {
      const msg = getErrMessage(e);

      toast({
        title: t("common.save.failed.message"),
        description: `${t("settings.notification.config.failed.message")}: ${msg}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <Input
        placeholder="Url"
        value={webhook.data.url}
        onChange={(e) => {
          const newData = {
            ...webhook,
            data: {
              ...webhook.data,
              url: e.target.value,
            },
          };

          checkChanged(newData.data);
          setWebhook(newData);
        }}
      />

      <div className="flex items-center space-x-1 mt-2">
        <Switch id="airplane-mode" checked={webhook.data.enabled} onCheckedChange={handleSwitchChange} />
        <Label htmlFor="airplane-mode">{t("settings.notification.config.enable")}</Label>
      </div>

      <div className="flex justify-end mt-2">
        <Show when={changed}>
          <Button
            onClick={() => {
              handleSaveClick();
            }}
          >
            {t("common.save")}
          </Button>
        </Show>

        <Show when={!changed && webhook.id != ""}>
          <Button
            variant="secondary"
            onClick={() => {
              handlePushTestClick();
            }}
          >
            {t("settings.notification.config.push.test.message")}
          </Button>
        </Show>
      </div>
    </div>
  );
};

export default Webhook;

