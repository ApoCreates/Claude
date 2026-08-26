"""The portal over HTTP: pages render, and the gates hold from the outside too."""

from __future__ import annotations

import time

import pytest

pytest.importorskip("fastapi")

from fastapi.testclient import TestClient  # noqa: E402

from aigency_crew.portal.app import create_app  # noqa: E402
from aigency_crew.portal.jobs import AWAITING, Job, JobStore  # noqa: E402


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("AIGENCY_HOME", str(tmp_path))
    app = create_app(jobs_root=tmp_path / "jobs")
    return TestClient(app), JobStore(tmp_path / "jobs")


def make_job(store, **params) -> Job:
    job = Job.create({"dry_run": True, **params})
    store.save(job)
    return job


class TestPages:
    def test_the_index_renders_with_no_runs(self, client):
        http, _ = client
        response = http.get("/")
        assert response.status_code == 200
        assert "Start a run" in response.text

    def test_the_index_warns_when_there_is_no_search_key(self, client, monkeypatch):
        monkeypatch.delenv("SERPER_API_KEY", raising=False)
        http, _ = client
        assert "cannot search" in http.get("/").text

    def test_a_job_page_renders(self, client):
        http, store = client
        job = make_job(store)
        response = http.get(f"/jobs/{job.id}")
        assert response.status_code == 200
        assert job.id in response.text
        assert "funding" in response.text

    def test_an_unknown_job_is_a_404(self, client):
        http, _ = client
        assert http.get("/jobs/job-nope").status_code == 404

    def test_the_memory_page_renders(self, client):
        http, _ = client
        response = http.get("/ledger")
        assert response.status_code == 200
        assert "What the agents have learned" in response.text


class TestLaunchAndGates:
    def test_launching_a_run_creates_a_job_and_redirects_to_it(self, client):
        http, store = client
        response = http.post(
            "/jobs",
            data={"region": "UAE", "dry_run": "1"},
            follow_redirects=False,
        )
        assert response.status_code == 303
        assert store.list(), "the run should exist even before the stage finishes"

    def test_a_stage_cannot_be_started_out_of_order_over_http(self, client):
        http, store = client
        job = make_job(store)
        response = http.post(f"/jobs/{job.id}/stages/outreach/run")
        assert response.status_code == 409
        assert "approved" in response.json()["detail"]

    def test_rejecting_without_a_note_is_refused(self, client):
        http, store = client
        job = make_job(store)
        job.stages["funding"].status = AWAITING
        store.save(job)
        response = http.post(f"/jobs/{job.id}/stages/funding/reject", data={"note": "  "})
        assert response.status_code == 400


class TestDataOut:
    def _finished_job(self, store):
        job = make_job(store)
        state = job.stages["funding"]
        state.status = AWAITING
        state.rounds.append(
            type(state.rounds)([])  # placeholder replaced below
        ) if False else None
        from aigency_crew.demo import sample_funding
        from aigency_crew.portal.jobs import RoundRecord

        state.rounds.append(
            RoundRecord(
                number=1,
                score=81.0,
                blockers=0,
                verdict="pass",
                summary="fine",
                artifact=sample_funding().model_dump(mode="json"),
            )
        )
        state.selected_round = 1
        store.save(job)
        return job

    def test_a_stage_artifact_downloads_as_json(self, client):
        http, store = client
        job = self._finished_job(store)
        response = http.get(f"/jobs/{job.id}/download/funding.json")
        assert response.status_code == 200
        assert "attachment" in response.headers["content-disposition"]
        assert response.json()["opportunities"]

    def test_an_individual_round_downloads(self, client):
        http, store = client
        job = self._finished_job(store)
        assert http.get(f"/jobs/{job.id}/download/round/funding/1.json").status_code == 200
        assert http.get(f"/jobs/{job.id}/download/round/funding/7.json").status_code == 404

    def test_downloading_a_stage_that_produced_nothing_is_a_404(self, client):
        http, store = client
        job = make_job(store)
        assert http.get(f"/jobs/{job.id}/download/clients.json").status_code == 404

    def test_the_report_renders_and_downloads_as_markdown(self, client):
        http, store = client
        job = self._finished_job(store)
        assert "Example Creative AI Fund" in http.get(f"/jobs/{job.id}/report").text
        download = http.get(f"/jobs/{job.id}/report.md")
        assert download.text.startswith("# job-")

    def test_the_json_api_carries_state_and_progress(self, client):
        http, store = client
        job = self._finished_job(store)
        payload = http.get(f"/api/jobs/{job.id}").json()
        assert payload["id"] == job.id
        assert payload["stages"]["funding"]["selected_round"] == 1
        assert "progress" in payload


class TestLedgerActions:
    def test_recording_a_campaign_result_persists_it(self, client):
        http, _ = client
        http.post(
            "/ledger/outcome",
            data={"campaign": "q3", "segment": "hospitality", "sent": 100, "replies": 9},
            follow_redirects=False,
        )
        assert "9.0%" in http.get("/ledger").text


class TestSupervisedRunEndToEnd:
    """Walk a whole run through the portal the way a person would."""

    @staticmethod
    def _wait_for(http, job_id, status, stage, attempts=200):
        for _ in range(attempts):
            payload = http.get(f"/api/jobs/{job_id}").json()
            if payload["stages"][stage]["status"] == status:
                return payload
            time.sleep(0.02)
        raise AssertionError(
            f"{stage} never reached {status}; "
            f"last seen {payload['stages'][stage]['status']}"
        )

    def test_launch_gate_approve_gate_approve_gate_then_report(self, client):
        http, store = client

        http.post("/jobs", data={"dry_run": "1"}, follow_redirects=False)
        job_id = store.list()[0].id

        payload = self._wait_for(http, job_id, AWAITING, "funding")
        assert payload["stages"]["clients"]["status"] == "pending", (
            "the client agent must not start until funding is approved"
        )
        assert len(payload["stages"]["funding"]["rounds"]) == 2

        # The job page renders in the awaiting state, with the gate on it.
        page = http.get(f"/jobs/{job_id}").text
        assert "Approve" in page and "Send back" in page

        http.post(f"/jobs/{job_id}/stages/funding/approve", data={"note": "good enough"})
        self._wait_for(http, job_id, AWAITING, "clients")

        http.post(f"/jobs/{job_id}/stages/clients/approve", data={})
        self._wait_for(http, job_id, AWAITING, "outreach")

        http.post(f"/jobs/{job_id}/stages/outreach/approve", data={})
        final = http.get(f"/api/jobs/{job_id}").json()
        assert final["complete"]

        report = http.get(f"/jobs/{job_id}/report.md").text
        assert "Example Creative AI Fund" in report
        assert "Example Hospitality Group" in report
        assert "Reply STOP" in report

    def test_sending_a_stage_back_reruns_it_with_the_note(self, client):
        http, store = client

        http.post("/jobs", data={"dry_run": "1"}, follow_redirects=False)
        job_id = store.list()[0].id
        self._wait_for(http, job_id, AWAITING, "funding")

        http.post(
            f"/jobs/{job_id}/stages/funding/reject",
            data={"note": "Only UAE programmes, drop the rest", "rerun": "1"},
        )
        payload = self._wait_for(http, job_id, AWAITING, "funding")

        assert len(payload["stages"]["funding"]["rounds"]) > 2, "the re-run adds rounds"
        notes = [n["note"] for n in payload["stages"]["funding"]["notes"]]
        assert any("Only UAE programmes" in n for n in notes)
        assert payload["stages"]["clients"]["status"] == "pending"
