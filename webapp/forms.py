from django import forms
from django.contrib.auth import authenticate
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.models import User


class EmailAuthenticationForm(AuthenticationForm):
    username = forms.EmailField(
        label="Email",
        widget=forms.EmailInput(attrs={"autofocus": True, "autocomplete": "email"}),
    )

    def clean(self):
        email = self.cleaned_data.get("username", "").strip().lower()
        password = self.cleaned_data.get("password")

        if email and password:
            try:
                user_obj = User.objects.get(email__iexact=email)
            except User.DoesNotExist:
                user_obj = None

            if user_obj is not None:
                self.user_cache = authenticate(
                    self.request,
                    username=user_obj.username,
                    password=password,
                )

            if self.user_cache is None:
                raise forms.ValidationError("Email yoki parol noto'g'ri.", code="invalid_login")
            self.confirm_login_allowed(self.user_cache)

        return self.cleaned_data
