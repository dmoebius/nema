import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import {
  Box,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  Chip,
  Divider,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useContactsStore } from "../store/contacts";
import type {
  Contact,
  ContactFormData,
  Phone,
  Email,
  Address,
  PhoneType,
  EmailType,
  AddressType,
} from "../types/contact";

// ── Static data outside the component ───────────────────────────────────────

const phoneTypes: { value: PhoneType; label: string }[] = [
  { value: "mobile", label: "Mobil" },
  { value: "home", label: "Privat" },
  { value: "work", label: "Arbeit" },
  { value: "other", label: "Sonstige" },
];
const emailTypes: { value: EmailType; label: string }[] = [
  { value: "home", label: "Privat" },
  { value: "work", label: "Arbeit" },
  { value: "other", label: "Sonstige" },
];
const addressTypes: { value: AddressType; label: string }[] = [
  { value: "home", label: "Privat" },
  { value: "work", label: "Arbeit" },
  { value: "other", label: "Sonstige" },
];

function emptyPhone(): Phone {
  return { id: uuidv4(), type: "mobile", number: "" };
}
function emptyEmail(): Email {
  return { id: uuidv4(), type: "home", address: "" };
}
function emptyAddress(): Address {
  return {
    id: uuidv4(),
    type: "home",
    street: "",
    city: "",
    zip: "",
    country: "",
  };
}

// Subtle colored left border for section headers
const sectionHeaderSx = {
  borderLeft: "3px solid",
  borderColor: "primary.main",
  pl: 1.5,
  py: 0.25,
  mb: 1.5,
  color: "primary.dark",
  fontWeight: 600,
  fontSize: "0.8rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
};

// ── Main component ───────────────────────────────────────────────────────────

export const ContactEditPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { getContact, addContact, updateContact, getAllTags, contacts } =
    useContactsStore();
  const isNew = !id || id === "new";

  // Lazy state initialization: no useEffect needed, the component is remounted
  // on every new ID via the key reset in App.tsx.
  // (rerender-derived-state-no-effect + rerender-lazy-state-init)
  const [firstName, setFirstName] = useState(() => {
    if (isNew || !id) return "";
    return getContact(id)?.firstName ?? "";
  });
  const [lastName, setLastName] = useState(() => {
    if (isNew || !id) return "";
    return getContact(id)?.lastName ?? "";
  });
  const [company, setCompany] = useState(() => {
    if (isNew || !id) return "";
    return getContact(id)?.company ?? "";
  });
  const [birthday, setBirthday] = useState(() => {
    if (isNew || !id) return "";
    return getContact(id)?.birthday ?? "";
  });
  const [note, setNote] = useState(() => {
    if (isNew || !id) return "";
    return getContact(id)?.note ?? "";
  });
  const [phones, setPhones] = useState<Phone[]>(() => {
    if (isNew || !id) return [];
    return getContact(id)?.phones ?? [];
  });
  const [emails, setEmails] = useState<Email[]>(() => {
    if (isNew || !id) return [];
    return getContact(id)?.emails ?? [];
  });
  const [addresses, setAddresses] = useState<Address[]>(() => {
    if (isNew || !id) return [];
    return getContact(id)?.addresses ?? [];
  });
  const [tags, setTags] = useState<string[]>(() => {
    if (isNew || !id) return [];
    return getContact(id)?.tags ?? [];
  });
  const [sponsorId, setSponsorId] = useState<string>(() => {
    if (isNew || !id) return "";
    return getContact(id)?.sponsorId ?? "";
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const allTags = getAllTags();

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!firstName.trim() && !lastName.trim()) {
      e.name = "Vor- oder Nachname ist erforderlich";
    }
    emails.forEach((em, i) => {
      if (!em.address.trim())
        e[`email_${i}`] = "E-Mail-Adresse eingeben oder Feld entfernen";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const data: ContactFormData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      company: company.trim() || undefined,
      birthday: birthday || undefined,
      note: note.trim() || undefined,
      phones: phones.filter((p) => p.number.trim()),
      emails: emails.filter((e) => e.address.trim()),
      addresses: addresses.filter((a) => a.street.trim() || a.city.trim()),
      tags,
      sponsorId: sponsorId || undefined,
    };
    try {
      if (isNew) {
        const c = await addContact(data);
        navigate(`/contacts/${c.id}`, { replace: true });
      } else if (id) {
        await updateContact(id, data);
        navigate(`/contacts/${id}`, { replace: true });
      }
    } finally {
      setSaving(false);
    }
  };

  // Phone handlers (functional updates: rerender-functional-setstate)
  const updatePhone = (idx: number, field: keyof Phone, value: string) =>
    setPhones((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)),
    );
  const removePhone = (idx: number) =>
    setPhones((prev) => prev.filter((_, i) => i !== idx));
  const addPhone = () => setPhones((prev) => [...prev, emptyPhone()]);

  // Email handlers
  const updateEmail = (idx: number, field: keyof Email, value: string) =>
    setEmails((prev) =>
      prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e)),
    );
  const removeEmail = (idx: number) =>
    setEmails((prev) => prev.filter((_, i) => i !== idx));
  const addEmail = () => setEmails((prev) => [...prev, emptyEmail()]);

  // Address handlers
  const updateAddress = (idx: number, field: keyof Address, value: string) =>
    setAddresses((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, [field]: value } : a)),
    );
  const removeAddress = (idx: number) =>
    setAddresses((prev) => prev.filter((_, i) => i !== idx));
  const addAddress = () => setAddresses((prev) => [...prev, emptyAddress()]);

  const sponsorOptions = contacts.filter((c) => c.id !== id);

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", p: 2, pb: 6 }}>
      <Typography
        variant="h6"
        sx={{
          mb: 2.5,
          fontFamily: '"DM Serif Display", serif',
          fontWeight: 400,
          color: "text.primary",
        }}
      >
        {isNew ? "Neuer Kontakt" : "Kontakt bearbeiten"}
      </Typography>

      {/* Name */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography sx={sectionHeaderSx}>Name</Typography>
          {errors.name && (
            <Typography
              color="error"
              variant="caption"
              display="block"
              sx={{ mb: 1 }}
            >
              {errors.name}
            </Typography>
          )}
          <Stack gap={1.5}>
            <TextField
              label="Vorname"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              fullWidth
              size="small"
            />
            <TextField
              label="Nachname"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              fullWidth
              size="small"
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Company */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography sx={sectionHeaderSx}>Firma</Typography>
          <TextField
            label="Firma / Organisation"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            fullWidth
            size="small"
          />
        </CardContent>
      </Card>

      {/* Phone */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 1.5 }}
          >
            <Typography sx={sectionHeaderSx}>Telefon</Typography>
            <IconButton size="small" onClick={addPhone} color="primary">
              <AddIcon />
            </IconButton>
          </Stack>
          {phones.length === 0 && (
            <Typography variant="body2" color="text.disabled">
              Keine Telefonnummer. Tippe auf + um eine hinzuzufügen.
            </Typography>
          )}
          <Stack gap={1.5}>
            {phones.map((phone, idx) => (
              <Box key={phone.id}>
                {idx > 0 && <Divider sx={{ mb: 1.5 }} />}
                <Stack direction="row" gap={1} alignItems="flex-start">
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <InputLabel>Typ</InputLabel>
                    <Select
                      label="Typ"
                      value={phone.type}
                      onChange={(e) => updatePhone(idx, "type", e.target.value)}
                    >
                      {phoneTypes.map((t) => (
                        <MenuItem key={t.value} value={t.value}>
                          {t.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="Nummer"
                    value={phone.number}
                    onChange={(e) => updatePhone(idx, "number", e.target.value)}
                    fullWidth
                    size="small"
                    type="tel"
                  />
                  <IconButton
                    size="small"
                    onClick={() => removePhone(idx)}
                    color="error"
                    sx={{ mt: 0.5 }}
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </Stack>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* E-Mail */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 1.5 }}
          >
            <Typography sx={sectionHeaderSx}>E-Mail</Typography>
            <IconButton size="small" onClick={addEmail} color="primary">
              <AddIcon />
            </IconButton>
          </Stack>
          {emails.length === 0 && (
            <Typography variant="body2" color="text.disabled">
              Keine E-Mail-Adresse. Tippe auf + um eine hinzuzufügen.
            </Typography>
          )}
          <Stack gap={1.5}>
            {emails.map((email, idx) => (
              <Box key={email.id}>
                {idx > 0 && <Divider sx={{ mb: 1.5 }} />}
                <Stack direction="row" gap={1} alignItems="flex-start">
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <InputLabel>Typ</InputLabel>
                    <Select
                      label="Typ"
                      value={email.type}
                      onChange={(e) => updateEmail(idx, "type", e.target.value)}
                    >
                      {emailTypes.map((t) => (
                        <MenuItem key={t.value} value={t.value}>
                          {t.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="E-Mail"
                    value={email.address}
                    onChange={(e) =>
                      updateEmail(idx, "address", e.target.value)
                    }
                    fullWidth
                    size="small"
                    type="email"
                    error={!!errors[`email_${idx}`]}
                    helperText={errors[`email_${idx}`]}
                  />
                  <IconButton
                    size="small"
                    onClick={() => removeEmail(idx)}
                    color="error"
                    sx={{ mt: 0.5 }}
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </Stack>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Address */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 1.5 }}
          >
            <Typography sx={sectionHeaderSx}>Adresse</Typography>
            <IconButton size="small" onClick={addAddress} color="primary">
              <AddIcon />
            </IconButton>
          </Stack>
          {addresses.length === 0 && (
            <Typography variant="body2" color="text.disabled">
              Keine Adresse. Tippe auf + um eine hinzuzufügen.
            </Typography>
          )}
          <Stack gap={2}>
            {addresses.map((addr, idx) => (
              <Box key={addr.id}>
                {idx > 0 && <Divider sx={{ mb: 1.5 }} />}
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 1 }}
                >
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <InputLabel>Typ</InputLabel>
                    <Select
                      label="Typ"
                      value={addr.type}
                      onChange={(e) =>
                        updateAddress(idx, "type", e.target.value)
                      }
                    >
                      {addressTypes.map((t) => (
                        <MenuItem key={t.value} value={t.value}>
                          {t.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <IconButton
                    size="small"
                    onClick={() => removeAddress(idx)}
                    color="error"
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </Stack>
                <Stack gap={1}>
                  <TextField
                    label="Straße"
                    value={addr.street}
                    onChange={(e) =>
                      updateAddress(idx, "street", e.target.value)
                    }
                    fullWidth
                    size="small"
                  />
                  <Stack direction="row" gap={1}>
                    <TextField
                      label="PLZ"
                      value={addr.zip}
                      onChange={(e) =>
                        updateAddress(idx, "zip", e.target.value)
                      }
                      size="small"
                      sx={{ width: 100 }}
                    />
                    <TextField
                      label="Ort"
                      value={addr.city}
                      onChange={(e) =>
                        updateAddress(idx, "city", e.target.value)
                      }
                      fullWidth
                      size="small"
                    />
                  </Stack>
                  <TextField
                    label="Land"
                    value={addr.country}
                    onChange={(e) =>
                      updateAddress(idx, "country", e.target.value)
                    }
                    fullWidth
                    size="small"
                  />
                </Stack>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Birthday */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography sx={sectionHeaderSx}>Geburtstag</Typography>
          <TextField
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            label="Datum"
          />
        </CardContent>
      </Card>

      {/* Tags */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography sx={sectionHeaderSx}>Tags / Gruppen</Typography>
          <Autocomplete
            multiple
            freeSolo
            options={allTags}
            value={tags}
            onChange={(_, newValue) => setTags(newValue as string[])}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option}
                  size="small"
                  {...getTagProps({ index })}
                  key={option}
                  sx={{ fontWeight: 500 }}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label="Tags eingeben oder auswählen"
                placeholder="z.B. Interessent, Kunde…"
              />
            )}
          />
        </CardContent>
      </Card>

      {/* Sponsor */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography sx={sectionHeaderSx}>Gesponsert von (Upline)</Typography>
          <Autocomplete
            options={sponsorOptions}
            getOptionLabel={(c) =>
              [c.firstName, c.lastName].filter(Boolean).join(" ")
            }
            value={sponsorOptions.find((c) => c.id === sponsorId) ?? null}
            onChange={(_, newValue) =>
              setSponsorId((newValue as Contact | null)?.id ?? "")
            }
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label="Sponsor / Upline auswählen"
                placeholder="Suche…"
              />
            )}
          />
        </CardContent>
      </Card>

      {/* Note */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography sx={sectionHeaderSx}>Notiz</Typography>
          <TextField
            label="Notiz"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            fullWidth
            multiline
            rows={3}
            size="small"
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <Stack direction="row" gap={2}>
        <Button
          variant="outlined"
          fullWidth
          onClick={() => navigate(-1)}
          disabled={saving}
        >
          Abbrechen
        </Button>
        <Button
          variant="contained"
          fullWidth
          onClick={handleSave}
          disabled={saving}
          startIcon={
            saving ? <CircularProgress size={16} color="inherit" /> : undefined
          }
        >
          {saving ? "Speichern…" : "Speichern"}
        </Button>
      </Stack>
    </Box>
  );
};
